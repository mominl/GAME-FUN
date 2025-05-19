import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
// Remove import of TextEncoder from util - browser already has this built in

// Extend the Window interface to include the solana property
declare global {
  interface Window {
    solana?: any;
  }
}

// Gateway configuration - safe to expose
const PINATA_GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'plum-real-turtle-247.mypinata.cloud';

// Interfaces
export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator_wallet?: string;
  creator_youtube?: string;
}

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  initialSupply: number;
  wallet: web3.PublicKey;
  connection: web3.Connection;
  youtubeUsername?: string;
}

/**
 * Uploads an image to IPFS via secure Vercel API route
 */
export async function uploadImageToIPFS(image: File): Promise<string> {
  try {    console.log('Starting image upload to IPFS via secure API...');
    
    const formData = new FormData();
    
    // Add the file to form data with a unique name
    formData.append("file", image);
    formData.append("name", `memecoin-image-${Date.now()}`);
    
    // Add metadata as keyvalues
    const keyvalues = JSON.stringify({
      keyvalues: {
        app: "gamefun-memecoin",
        type: "token-image"
      }
    });
    formData.append("keyvalues", keyvalues);
    
    // Make the request to our secure API endpoint that handles the sensitive keys
    const request = await fetch('/api/token-operations', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'upload-to-ipfs',
        data: formData
      }),
    });
    
    const response = await request.json();
    console.log('Upload response:', response);
    
    if (!response.cid) {
      throw new Error('Failed to get CID from upload service');
    }
    
    const imageUrl = response.url;
    console.log('Image uploaded successfully:', imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}

/**
 * Creates and uploads metadata JSON to IPFS via secure API endpoint
 */
export async function uploadMetadataToIPFS(metadata: TokenMetadata): Promise<string> {
  try {    console.log('Creating and uploading metadata JSON...');
    
    // Create the metadata object with proper structure
    const metadataObj = {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      image: metadata.image,
      properties: {
        files: [
          {
            uri: metadata.image,
            type: 'image/png'
          }
        ],
        creators: [
          {
            address: metadata.creator_wallet || "",
            share: 100
          }
        ]
      },
      attributes: [
        {
          trait_type: "Creator Wallet",
          value: metadata.creator_wallet || ""
        },
        {
          trait_type: "Creator YouTube",
          value: metadata.creator_youtube || ""
        }
      ]
    };
    
    // Make the request to our secure API endpoint
    const request = await fetch('/api/token-operations', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: 'create-metadata',
        data: {
          metadata: metadataObj,
          name: `memecoin-metadata-${metadata.symbol}-${Date.now()}`,
          keyvalues: {
            app: "gamefun-memecoin",
            type: "token-metadata",
            tokenSymbol: metadata.symbol
          }
        }
      })
    });
    
    const response = await request.json();
    console.log('Upload response for metadata:', response);
    
    if (!response.cid) {
      throw new Error('Failed to get CID for metadata');
    }
    
    const metadataUrl = response.url;
    console.log('Metadata uploaded successfully:', metadataUrl);
    return metadataUrl;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

/**
 * Creates a new SPL token on Solana
 */
export async function createToken(params: CreateTokenParams): Promise<string> {
  const { name, symbol, description, image, initialSupply, wallet, connection, youtubeUsername } = params;
  
  console.log('Starting token creation process for', name, symbol);
  
  try {
    // TEMPORARILY DISABLED: IPFS Upload functionality
    // Use a default image URL instead of attempting IPFS uploads
    const imageUrl = 'https://ipfs.io/ipfs/bafkreiabag3ztnhe5pg7js4bj6sxuvkz3sdf5qpekhoejb5xtu335uwv5a'; // Default image
    
    // 1. Create metadata without IPFS upload
    const metadata = {
      name,
      symbol,
      description,
      image: imageUrl,
      creator_wallet: wallet.toBase58(),
      creator_youtube: youtubeUsername
    };
      console.log('Using default image and skipping IPFS uploads');
    
    // Skip the metadata upload and continue with token creation
    // We'll use a mock metadata URL since we're skipping IPFS
    const mockMetadataUrl = `https://ipfs.io/ipfs/placeholder-metadata-${Date.now()}`;
    console.log('Using mock metadata URL:', mockMetadataUrl);
    
    // 3. Create token mint account
    console.log('Creating token mint account...');
    const mintKeypair = web3.Keypair.generate();
    const mintRent = await connection.getMinimumBalanceForRentExemption(
      splToken.MintLayout.span
    );
    
    // Create transaction for token mint creation
    const createAccountTx = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: wallet,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: mintRent,
        space: splToken.MintLayout.span,
        programId: splToken.TOKEN_PROGRAM_ID
      })
    );
    
    // 4. Initialize the mint
    const initMintTx = new web3.Transaction().add(
      splToken.createInitializeMintInstruction(
        mintKeypair.publicKey,
        9, // 9 decimals is standard for SPL tokens
        wallet,
        wallet,
        splToken.TOKEN_PROGRAM_ID
      )
    );
    
    // 5. Create token account for the owner
    const tokenAccount = await splToken.getAssociatedTokenAddress(
      mintKeypair.publicKey, 
      wallet
    );
    
    const createTokenAccountTx = new web3.Transaction().add(
      splToken.createAssociatedTokenAccountInstruction(
        wallet,
        tokenAccount,
        wallet,
        mintKeypair.publicKey
      )
    );
    
    // 6. Mint initial supply to owner
    const mintToTx = new web3.Transaction().add(
      splToken.createMintToInstruction(
        mintKeypair.publicKey,
        tokenAccount,
        wallet,
        BigInt(initialSupply) * BigInt(1e9), // Convert to lamports (9 decimals)
        [],
        splToken.TOKEN_PROGRAM_ID
      )
    );
      // 7. Add metadata using Metaplex (temporarily simplified without IPFS metadata)
    const METADATA_PROGRAM_ID = new web3.PublicKey(
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
    );
    
    // Note: We're skipping actual metadata integration for now
    // When the IPFS functionality is restored, we'll need to properly integrate this    const [metadataPDA] = await web3.PublicKey.findProgramAddress(
      [
        new TextEncoder().encode('metadata'),
        METADATA_PROGRAM_ID.toBytes(),
        mintKeypair.publicKey.toBytes()
      ],
      METADATA_PROGRAM_ID
    );
    
    console.log('Skipping Metaplex metadata integration - will be added later');
    
    // 8. Combine all transactions
    console.log('Preparing transactions for signature...');
    
    // Create batch of transactions
    const batchTransactions = [
      createAccountTx,
      initMintTx,
      createTokenAccountTx,
      mintToTx
    ];
    
    // Send and confirm each transaction
    for (let i = 0; i < batchTransactions.length; i++) {
      const tx = batchTransactions[i];
      
      // Set recent blockhash and fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet;
      
      // For the first transaction, we need to sign with the mint keypair
      if (i === 0) {
        tx.sign(mintKeypair);
      }
      
      // Request wallet signature
      const signedTx = await window.solana.signTransaction(tx);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      console.log(`Transaction ${i + 1} confirmed:`, signature);
    }
    
    console.log('Token created successfully!');
    return mintKeypair.publicKey.toString();
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

/**
 * Tests the connection to the proxy server
 */
export async function testProxyConnection(): Promise<boolean> {
  try {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://127.0.0.1:8787';
    console.log('Testing connection to:', SERVER_URL);
    
    // Use the special /ping endpoint that has explicit CORS headers
    const response = await fetch(`${SERVER_URL}/ping`, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Proxy server response:', data);
      return true;
    }
    
    console.warn('Server responded with non-OK status:', response.status);
    return false;
  } catch (error) {
    console.error('Error connecting to proxy server:', error);
    
    // If we get a specific CORS error, provide more helpful debugging
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('This may be a CORS issue. Ensure the server has proper CORS headers.');
    }
    
    return false;
  }
}

// Connection setup
const connection = new web3.Connection(
  import.meta.env.VITE_SOLANA_RPC_URL || web3.clusterApiUrl('mainnet-beta'),
  'confirmed'
);
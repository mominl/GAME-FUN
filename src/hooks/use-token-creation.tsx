import { useState, useEffect } from 'react';
import * as web3 from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
// Import from our fixed version of tokenService
import { createToken, testProxyConnection } from '@/services/tokenServiceFix';

interface TokenFormData {
  name: string;
  symbol: string;
  image: File | null;
  imageUrl: string;
  initialSupply: string;
  startingPrice: string;
  priceUnit: string;
  description: string;
  creatorYouTube?: string;
}

export function useTokenCreation() {  const { publicKey } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenMintAddress, setTokenMintAddress] = useState('');
  const [proxyServerAvailable, setProxyServerAvailable] = useState(false);
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState(false);
  
  // Check proxy server availability on component mount
  useEffect(() => {
    async function checkProxyServer() {
      const isAvailable = await testProxyConnection();
      setProxyServerAvailable(isAvailable);
      if (!isAvailable) {
        console.warn('Proxy server not available. IPFS uploads may fail due to CORS issues.');
      }
    }
    
    checkProxyServer();
  }, []);
  
  // Function to request SOL airdrop (devnet only)
  async function requestDevnetAirdrop(connection: web3.Connection, publicKey: web3.PublicKey): Promise<boolean> {
    setIsRequestingAirdrop(true);
    try {
      toast({
        title: "Requesting SOL",
        description: "Requesting devnet SOL to fund your token creation...",
      });
      
      // Request 1 SOL (1 billion lamports)
      const signature = await connection.requestAirdrop(
        publicKey,
        1_000_000_000 // 1 SOL in lamports
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      toast({
        title: "Airdrop Successful",
        description: "Your wallet has been funded with devnet SOL!",
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting SOL airdrop:', error);
      toast({
        title: "Airdrop Failed",
        description: "Could not get devnet SOL. Please try again later or request from a faucet manually.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRequestingAirdrop(false);
    }
  }async function createMemeCoin(formData: TokenFormData): Promise<string> {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
        // TEMPORARILY DISABLED: Proxy server check
    // Skipping proxy server check since we're using a default image
    
    console.log("Skipping IPFS upload server check - using default image...");
    
    // We still warn about the server being unavailable in case we need this info elsewhere
    if (!proxyServerAvailable) {
      console.warn("Note: IPFS proxy server is unavailable, but continuing with default image");
    }
    
    setIsSubmitting(true);
      try {
      toast({
        title: "Creating your meme coin",
        description: "Please wait while we set up your token...",
      });
      
      // Connect to Solana
      const connection = new web3.Connection(
        import.meta.env.VITE_SOLANA_RPC_URL || web3.clusterApiUrl('devnet'),
        'confirmed'
      );
      
      // Check wallet balance
      try {
        const balance = await connection.getBalance(publicKey);
        console.log(`Current wallet balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
        
        // If balance is too low, request an airdrop (only on devnet)
        if (balance < web3.LAMPORTS_PER_SOL * 0.05) {  // Less than 0.05 SOL
          console.log('Wallet balance too low, requesting devnet airdrop');
          
          const isDevnet = import.meta.env.VITE_SOLANA_RPC_URL?.includes('devnet') || 
                          !import.meta.env.VITE_SOLANA_RPC_URL;
                          
          if (isDevnet) {
            const airdropSuccess = await requestDevnetAirdrop(connection, publicKey);
            if (!airdropSuccess) {
              throw new Error('Insufficient balance to create token and airdrop failed');
            }
          } else {
            throw new Error('Insufficient balance to create token. Please add SOL to your wallet.');
          }
        }
      } catch (balanceError) {
        console.error('Error checking wallet balance:', balanceError);
      }
        // Get creator data from Supabase to include YouTube info
      let youtubeUsername = formData.creatorYouTube;
      
      // If no YouTube username provided, try to fetch from creator data
      if (!youtubeUsername) {
        try {
          const { data } = await supabase
            .from('creators')
            .select('youtube_username')
            .eq('wallet_address', publicKey.toBase58())
            .maybeSingle();
          
          if (data?.youtube_username) {
            youtubeUsername = data.youtube_username;
          }
        } catch (error) {
          console.warn('Could not fetch creator YouTube info:', error);
        }
      }
      
      // Create the token on Solana
      const mintAddress = await createToken({
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: formData.image,
        initialSupply: Number(formData.initialSupply),
        wallet: publicKey,
        connection,
        youtubeUsername
      });
      
      // Save token data to Supabase
      await supabase.from('meme_coins').insert({
        creator_wallet_address: publicKey.toBase58(),
        name: formData.name,
        symbol: formData.symbol,
        initial_supply: Number(formData.initialSupply),
        starting_price: Number(formData.startingPrice),
        price_unit: formData.priceUnit,
        description: formData.description,
        token_mint_address: mintAddress
      });
      
      setTokenMintAddress(mintAddress);
      
      toast({
        title: "Success!",
        description: `Your meme coin ${formData.name} (${formData.symbol}) is live on Solana!`,
      });
      
      return mintAddress;    } catch (error) {
      console.error('Error creating meme coin:', error);      // Provide more specific error messages based on the error type and message
      if (error instanceof Error) {
        if (error.message.includes('Attempt to debit an account but found no record of a prior credit') ||
            error.message.includes('Insufficient balance to create token')) {
          toast({
            title: "Insufficient SOL Balance",
            description: "Your wallet doesn't have enough SOL to pay for this transaction. Request devnet SOL and try again.",
            variant: "destructive",
          });
          
          // Attempt to airdrop again if we're on devnet
          const connection = new web3.Connection(
            import.meta.env.VITE_SOLANA_RPC_URL || web3.clusterApiUrl('devnet'),
            'confirmed'
          );
          
          const isDevnet = import.meta.env.VITE_SOLANA_RPC_URL?.includes('devnet') || 
                          !import.meta.env.VITE_SOLANA_RPC_URL;
          
          if (isDevnet && publicKey) {
            setTimeout(() => {
              requestDevnetAirdrop(connection, publicKey);
            }, 500);
          }
        } else if (error.message.includes('TextEncoder is not a constructor')) {
          toast({
            title: "Browser Compatibility Error",
            description: "There's an issue with the token creation process in this browser. Please try a different browser like Chrome or Firefox.",
            variant: "destructive",
          });
        } else if (error.message.includes('Failed to upload image to IPFS') || 
            error.message.includes('Failed to upload metadata')) {
          toast({
            title: "IPFS Upload Failed",
            description: "Could not upload to IPFS. The proxy server might be unavailable or experiencing issues.",
            variant: "destructive",
          });
        } else if (error.message.includes('Proxy server unavailable')) {
          toast({
            title: "Proxy Server Error",
            description: "Cannot connect to the IPFS proxy server. Please try again later.",
            variant: "destructive",
          }); 
        } else if (error.message.includes('Wallet')) {
          toast({
            title: "Wallet Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to create meme coin",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Failed to create meme coin",
          description: "There was an error creating your meme coin",
          variant: "destructive",
        });
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }
    return {
    createMemeCoin,
    isSubmitting,
    tokenMintAddress,
    isRequestingAirdrop,
    requestDevnetAirdrop
  };
}
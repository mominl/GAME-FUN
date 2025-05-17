import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getVerificationStatus } from "@/utils/getVerificationStatus";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import WalletConnect from "@/components/WalletConnect";
import { Coins, BadgeCheck, Upload, Link, Share2 } from "lucide-react";
import { useTokenCreation } from '@/hooks/use-token-creation';

// Type definition for meme coins to match our database schema
interface MemeCoin {
  creator_wallet_address: string;
  name: string;
  symbol: string;
  initial_supply: number;
  starting_price: number;
  price_unit: string;
  description: string;
  token_mint_address: string;
}

const CreateMemeCoin: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [eligibleForMemeCoin, setEligibleForMemeCoin] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [tokenMintAddress, setTokenMintAddress] = useState("");
  
  // Form state
  const [coinName, setCoinName] = useState("");
  const [coinSymbol, setSymbol] = useState("");
  const [coinImage, setCoinImage] = useState<File | null>(null);
  const [coinImageUrl, setCoinImageUrl] = useState<string>("");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [startingPrice, setStartingPrice] = useState("0.0001");
  const [priceUnit, setPriceUnit] = useState("SOL");
  const [description, setDescription] = useState("");
  const [formValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState({
    coinName: "",
    coinSymbol: "",
    coinImage: "",
    initialSupply: "",
    startingPrice: ""
  });

  const { 
    createMemeCoin, 
    isSubmitting: isCreatingToken, 
    isRequestingAirdrop,
    requestDevnetAirdrop 
  } = useTokenCreation();

  useEffect(() => {
    if (connected && publicKey) {
      fetchCreatorData();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    // Validate form when any input changes
    validateForm();
  }, [coinName, coinSymbol, coinImage, initialSupply, startingPrice, description]);

  const fetchCreatorData = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching creator data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch verification data",
          variant: "destructive",
        });
      } else {
        setCreatorData(data);
        
        // Always set eligible to true, removing subscriber requirement
        setEligibleForMemeCoin(true);
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    } finally {
      setLoading(false);
    }
  };
  const validateForm = () => {
    const newErrors = {
      coinName: "",
      coinSymbol: "",
      coinImage: "", // Still keep this for when we re-enable image upload
      initialSupply: "",
      startingPrice: ""
    };
    
    // Validate coin name
    if (!coinName) {
      newErrors.coinName = "Coin name is required";
    }
    
    // Validate symbol
    if (!coinSymbol) {
      newErrors.coinSymbol = "Symbol is required";
    } else if (coinSymbol.length > 5) {
      newErrors.coinSymbol = "Symbol must be 5 characters or less";
    }
    
    // TEMPORARILY DISABLED: Image validation
    // Comment out image validation since we're using a placeholder image
    // if (!coinImage && !coinImageUrl) {
    //   newErrors.coinImage = "Coin image is required";
    // }
    
    // Validate initial supply
    if (!initialSupply) {
      newErrors.initialSupply = "Initial supply is required";
    } else if (Number(initialSupply) < 1000000) {
      newErrors.initialSupply = "Initial supply must be at least 1,000,000";
    }
    
    // Validate starting price
    if (!startingPrice) {
      newErrors.startingPrice = "Starting price is required";
    } else if (Number(startingPrice) <= 0) {
      newErrors.startingPrice = "Starting price must be greater than 0";
    }
    
    setErrors(newErrors);
    
    // Check if the form is valid overall
    const valid = !Object.values(newErrors).some(error => error !== "");
    setFormValid(valid);
    
    return valid;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoinImage(file);
      setCoinImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value.substring(0, 5)); // Limit to 5 chars and force uppercase
  };
    const handleLaunchCoin = async () => {
    if (!validateForm() || !connected || isSubmitting || !publicKey) return;
    
    setIsSubmitting(true);
    
    try {
      // Temporarily comment out IPFS upload functionality
      // Use a placeholder image URL instead of actual upload
      const placeholderImageUrl = "https://ipfs.io/ipfs/bafkreiabag3ztnhe5pg7js4bj6sxuvkz3sdf5qpekhoejb5xtu335uwv5a";
      
      const tokenAddress = await createMemeCoin({
        name: coinName,
        symbol: coinSymbol,
        image: null, // Set to null to skip IPFS upload
        imageUrl: placeholderImageUrl, // Use placeholder image
        initialSupply,
        startingPrice,
        priceUnit,
        description
      });

      // Set token address for the success dialog
      setTokenMintAddress(tokenAddress);
      
      // Show success dialog
      setSuccessDialogOpen(true);
      
    } catch (error) {
      console.error('Error creating meme coin:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-game-black text-white py-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(155,135,245,0.15)_0,rgba(15,12,41,0)_70%)]"></div>
      <div className="absolute inset-0 bg-grid"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 neon-text">
            <Coins className="inline-block mr-2 mb-1" /> 
            Create Your <span className="neon-purple-text">Meme Coin</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            You're verified as a creator. Customize and launch your meme coin on Solana.
          </p>
          <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-md p-3 max-w-2xl mx-auto">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> Custom image uploads are temporarily disabled. All meme coins will use a default image while we fix our server issues.
            </p>
          </div>
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-neon-purple border-t-transparent rounded-full"></div>
          </div>
        ) : !connected ? (
          <div className="glass-card p-8 max-w-xl mx-auto text-center">
            <h3 className="font-orbitron text-xl mb-4">Connect Your Wallet</h3>
            <p className="mb-6 text-gray-400">Please connect your wallet to continue.</p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </div>
        ) : !creatorData?.youtube_verified && !creatorData ? (
          <div className="glass-card p-8 max-w-xl mx-auto text-center">
            <h3 className="font-orbitron text-xl mb-4">Verification Recommended</h3>
            <p className="mb-6 text-gray-400">
              Connecting your YouTube account is recommended but not required.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => navigate("/verify")}
                className="bg-neon-purple hover:bg-neon-purple/80"
              >
                Connect YouTube
              </Button>
              <Button 
                onClick={() => setEligibleForMemeCoin(true)}
                className="bg-neon-purple/30 hover:bg-neon-purple/50"
              >
                Skip Verification
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Creator Profile & Form */}
            <div className="md:col-span-2 space-y-6">
              {/* Creator Profile */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center">
                  <Avatar className="h-14 w-14 border-2 border-neon-purple/50">
                    <AvatarImage src={creatorData?.youtube_profile_image} />
                    <AvatarFallback className="bg-neon-purple/20 text-neon-purple">
                      {creatorData?.youtube_username?.substring(0, 2).toUpperCase() || "YT"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h3 className="font-orbitron text-lg">{creatorData?.youtube_username || "Creator"}</h3>
                      <Badge className="ml-2 bg-[#FF0000] text-white flex items-center">
                        <BadgeCheck size={12} className="mr-1" /> Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{creatorData?.youtube_subscribers?.toLocaleString()} subscribers</p>
                  </div>
                </div>
              </div>
              
              {/* Form */}
              <Card className="border-neon-purple/20 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-orbitron">Meme Coin Setup</CardTitle>
                  <CardDescription>Fill out the details for your new token</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Coin Name */}
                    <div>
                      <Label htmlFor="coin-name" className={errors.coinName ? "text-red-400" : ""}>
                        Coin Name *
                      </Label>
                      <Input
                        id="coin-name"
                        placeholder="e.g., Awesome Coin"
                        value={coinName}
                        onChange={(e) => setCoinName(e.target.value)}
                        className={`mt-1 ${errors.coinName ? "border-red-400" : "border-neon-purple/30"}`}
                      />
                      {errors.coinName && (
                        <p className="text-red-400 text-xs mt-1">{errors.coinName}</p>
                      )}
                    </div>
                    
                    {/* Coin Symbol */}
                    <div>
                      <Label htmlFor="coin-symbol" className={errors.coinSymbol ? "text-red-400" : ""}>
                        Coin Symbol (max 5 chars) *
                      </Label>
                      <Input
                        id="coin-symbol"
                        placeholder="e.g., AWSM"
                        value={coinSymbol}
                        onChange={handleSymbolChange}
                        className={`mt-1 ${errors.coinSymbol ? "border-red-400" : "border-neon-purple/30"}`}
                        maxLength={5}
                      />
                      {errors.coinSymbol && (
                        <p className="text-red-400 text-xs mt-1">{errors.coinSymbol}</p>
                      )}
                    </div>
                  </div>
                        {/* Coin Image - TEMPORARILY DISABLED */}
                  <div>
                    <Label htmlFor="coin-image">
                      Coin Image <span className="text-yellow-500 font-normal">(Using default image - upload temporarily disabled)</span>
                    </Label>
                    <div className="flex items-center mt-1">
                      <div 
                        className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed
                          border-yellow-500/50 mr-4 overflow-hidden"
                      >
                        {/* Always show a placeholder image */}
                        <img 
                          src="https://ipfs.io/ipfs/bafkreiabag3ztnhe5pg7js4bj6sxuvkz3sdf5qpekhoejb5xtu335uwv5a" 
                          alt="Default meme coin image" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 relative opacity-50 cursor-not-allowed"
                          disabled={true}
                        >
                          Image Upload Disabled
                        </Button>
                        <p className="text-xs text-yellow-500 mt-1">Image uploading is temporarily disabled due to IPFS server issues.</p>
                      </div>
                    </div>
                    {/* Hidden input - kept for future restoration */}
                    <input
                      id="coin-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Initial Supply */}
                    <div>
                      <Label htmlFor="initial-supply" className={errors.initialSupply ? "text-red-400" : ""}>
                        Initial Supply * (min: 1,000,000)
                      </Label>
                      <Input
                        id="initial-supply"
                        type="number"
                        placeholder="e.g., 1000000"
                        value={initialSupply}
                        onChange={(e) => setInitialSupply(e.target.value)}
                        className={`mt-1 ${errors.initialSupply ? "border-red-400" : "border-neon-purple/30"}`}
                        min="1000000"
                      />
                      {errors.initialSupply && (
                        <p className="text-red-400 text-xs mt-1">{errors.initialSupply}</p>
                      )}
                    </div>
                    
                    {/* Starting Price */}
                    <div>
                      <Label htmlFor="starting-price" className={errors.startingPrice ? "text-red-400" : ""}>
                        Starting Price *
                      </Label>
                      <div className="flex mt-1">
                        <Input
                          id="starting-price"
                          type="number"
                          placeholder="e.g., 0.0001"
                          value={startingPrice}
                          onChange={(e) => setStartingPrice(e.target.value)}
                          className={`flex-1 ${errors.startingPrice ? "border-red-400" : "border-neon-purple/30"}`}
                          step="0.0000001"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="ml-2 bg-gray-800 border-gray-700"
                          onClick={() => setPriceUnit(prev => prev === "SOL" ? "USD" : "SOL")}
                        >
                          {priceUnit}
                        </Button>
                      </div>
                      {errors.startingPrice && (
                        <p className="text-red-400 text-xs mt-1">{errors.startingPrice}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <Label htmlFor="description">
                      Description (optional, max 300 chars)
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your coin..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value.substring(0, 300))}
                      className="mt-1 border-neon-purple/30 resize-none"
                      maxLength={300}
                    />
                    <p className="text-xs text-right text-gray-400 mt-1">
                      {description.length}/300 characters
                    </p>
                  </div>
                    {/* Network and Devnet SOL */}
                  <div>
                    <Label>Network</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        value="Solana Devnet"
                        disabled
                        className="bg-gray-800/50 text-gray-400 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline" 
                        className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                        onClick={async () => {
                          if (!publicKey) {
                            toast({
                              title: "Wallet not connected",
                              description: "Please connect your wallet first",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const connection = new web3.Connection(
                            import.meta.env.VITE_SOLANA_RPC_URL || web3.clusterApiUrl('devnet'),
                            'confirmed'
                          );
                          
                          await requestDevnetAirdrop(connection, publicKey);
                        }}
                        disabled={isRequestingAirdrop || !connected}
                      >
                        {isRequestingAirdrop ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                            Getting SOL...
                          </>
                        ) : (
                          <>Get Devnet SOL</>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-green-400 mt-1">
                      Tokens are created on Solana Devnet. You need devnet SOL to pay for transaction fees.
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={handleLaunchCoin}
                    className={`bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-all ${
                      formValid ? "animate-pulse" : "opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!formValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>Launch My Meme Coin</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Preview Card */}
            <div className="md:col-span-1">
              <div className="sticky top-8">
                <Card className="border-neon-purple bg-black/40 backdrop-blur-sm overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(155,135,245,0.3)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(155,135,245,0.15)_0,rgba(15,12,41,0)_70%)]"></div>
                  
                  <CardHeader>
                    <CardTitle className="font-orbitron text-xl mb-1">Live Preview</CardTitle>
                    <CardDescription>Your coin will look like this</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">                    <div className="flex items-center justify-center mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-4 border-neon-purple/30 flex items-center justify-center relative">
                        {/* Always show the default image */}
                        <img 
                          src="https://ipfs.io/ipfs/bafkreiabag3ztnhe5pg7js4bj6sxuvkz3sdf5qpekhoejb5xtu335uwv5a"
                          alt="Default meme coin image" 
                          className="w-full h-full object-cover" 
                        />
                        {/* Show "default" badge */}
                        <span className="absolute bottom-0 left-0 right-0 bg-yellow-600/80 text-white text-[9px] py-1 text-center">
                          DEFAULT
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold font-orbitron">
                        {coinName || "Coin Name"}
                        {coinSymbol && <span className="text-neon-purple ml-2">${coinSymbol}</span>}
                      </h3>
                      
                      <div className="mt-2 text-sm font-semibold">
                        {startingPrice && (
                          <span className="bg-neon-purple/20 text-neon-purple px-2 py-1 rounded">
                            {startingPrice} {priceUnit}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 text-gray-400 text-sm min-h-[60px] text-center">
                      {description ? description : "Coin description will appear here..."}
                    </div>
                    
                    <div className="text-center text-xs text-gray-500">
                      <p>Initial Supply: {Number(initialSupply).toLocaleString()}</p>
                      <p>Network: Solana</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Dialog */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent className="bg-game-black border-neon-purple">
            <DialogHeader>
              <DialogTitle className="font-orbitron text-2xl flex items-center justify-center">
                <span className="text-3xl mr-2">🎉</span> Success!
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                Your meme coin ${coinSymbol} is live on Solana!
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-gray-900 p-4 rounded-md flex items-center mb-4">
                <div className="text-gray-400 text-sm mr-2">Token Address:</div>
                <div className="text-neon-purple font-mono text-sm truncate flex-1">
                  {tokenMintAddress}
                </div>
                <Button
                  variant="outline" 
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    navigator.clipboard.writeText(tokenMintAddress);
                    toast({
                      title: "Copied!",
                      description: "Token address copied to clipboard",
                    });
                  }}
                >
                  <Link size={14} />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="flex items-center justify-center border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                  onClick={() => {
                    const text = `Check out my new meme coin ${coinName} (${coinSymbol}) on Solana!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90"                  onClick={() => {
                    setSuccessDialogOpen(false);
                    if (publicKey) {
                      navigate(`/dashboard/wallet/${publicKey.toBase58()}`);
                    } else {
                      navigate("/dashboard");
                    }
                  }}
                >
                  View in Dashboard
                </Button>
              </div>
            </div>
            
            <DialogFooter className="text-center text-xs text-gray-500">
              <p className="w-full">
                Your token is now ready to be traded on decentralized exchanges.
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreateMemeCoin;

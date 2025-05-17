
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import WalletConnect from "@/components/WalletConnect";

const YoutubeCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsWallet, setNeedsWallet] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    // Store the auth code from URL in session storage
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    if (code) {
      sessionStorage.setItem("youtube_auth_code", code);
    }
    
    // Check wallet connection first
    if (!connected || !publicKey) {
      setNeedsWallet(true);
      setLoading(false);
      return;
    }
    
    setNeedsWallet(false);
    processYoutubeAuth();
  }, [location.search, publicKey, connected]);

  const processYoutubeAuth = async () => {
    try {
      if (!connected || !publicKey) {
        setError("Wallet not connected. Please connect your wallet first.");
        toast({
          variant: "destructive",
          title: "Wallet Not Connected",
          description: "Please connect your wallet before continuing with verification."
        });
        return;
      }

      // Get the code from session storage or URL
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get("code") || sessionStorage.getItem("youtube_auth_code");
      
      if (!code) {
        setError("No authorization code received from YouTube");
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "No authorization code received from YouTube."
        });
        return;
      }
      
      const walletAddress = publicKey.toBase58();
      console.log("Processing with wallet address:", walletAddress);
      
      // Call the Supabase Edge Function to handle YouTube auth
      const { data, error } = await supabase.functions.invoke('youtube-auth', {
        body: { 
          code, 
          walletAddress 
        }
      });
      
      if (error) {
        console.error("Error calling YouTube auth function:", error);
        setError("Failed to verify your YouTube account");
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "Could not verify your YouTube account. Please try again."
        });
        return;
      }
      
      if (data?.error) {
        console.error("YouTube auth function error:", data.error);
        setError(data.error);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: data.error || "Could not verify your YouTube account."
        });
        return;
      }
      
      // Success
      const isVerified = data?.verified;
      
      if (isVerified) {
        toast({
          title: "Verification Successful",
          description: "Your YouTube account has been verified!",
        });
      } else {
        toast({
          variant: "default",
          title: "Verification Status",
          description: `Your YouTube account has ${data?.subscribers} subscribers. You need at least 1,000 subscribers to be verified.`
        });
      }
      
      // Clear the stored code
      sessionStorage.removeItem("youtube_auth_code");
      
      // Navigate back to the verification page
      setTimeout(() => {
        navigate("/verify");
      }, 2000);
    } catch (e) {
      console.error("Error in YouTube callback:", e);
      setError("An unexpected error occurred");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    if (connected && publicKey) {
      setLoading(true);
      processYoutubeAuth();
    } else {
      setNeedsWallet(true);
    }
  };

  return (
    <div className="min-h-screen bg-game-black text-white flex flex-col items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <h1 className="font-orbitron text-2xl mb-6 text-center neon-text">
          YouTube Verification
        </h1>
        
        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mb-4"></div>
            <p>Processing your YouTube verification...</p>
          </div>
        ) : needsWallet ? (
          <div className="text-center">
            <div className="text-yellow-500 mb-4">⚠️</div>
            <p className="text-yellow-400 mb-2">Wallet Connection Required</p>
            <p className="text-gray-400 text-sm mb-6">Please connect your wallet to complete YouTube verification.</p>
            
            <div className="flex justify-center mb-4">
              <WalletConnect />
            </div>
            
            {publicKey && connected && (
              <Button 
                onClick={handleTryAgain} 
                className="mt-4 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple"
              >
                Continue Verification
              </Button>
            )}
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-400 mb-2">Verification Failed</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <Button
              onClick={handleTryAgain}
              className="mt-4 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/verify")}
              className="mt-4 ml-2 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300"
            >
              Return to Verification Page
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="mb-2">Redirecting you back...</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
              <div className="bg-neon-purple h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YoutubeCallback;

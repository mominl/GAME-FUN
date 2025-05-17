import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SocialVerification from "@/components/SocialVerification";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { getVerificationStatus } from "@/utils/getVerificationStatus";
import { Coins } from "lucide-react";

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [creatorData, setCreatorData] = useState<any>(null);
  const [eligibleForMemeCoin, setEligibleForMemeCoin] = useState(false);
  
  useEffect(() => {
    if (connected && publicKey) {
      fetchCreatorData();
    } else {
      setCreatorData(null);
      setEligibleForMemeCoin(false);
    }
  }, [connected, publicKey]);
  
  const fetchCreatorData = async () => {
    if (!publicKey) return;
    
    try {
      const { data } = await supabase
        .from('creators')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .maybeSingle();
      
      if (data) {
        setCreatorData(data);
        
        // Check eligibility for meme coin
        const status = getVerificationStatus(data?.youtube_subscribers);
        setEligibleForMemeCoin(status.eligibleForMemeCoin);
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-game-black text-white px-4 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(155,135,245,0.15)_0,rgba(15,12,41,0)_70%)]"></div>
      <div className="absolute inset-0 bg-grid"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 neon-text">
            Verify Your <span className="neon-purple-text">Creator</span> Status
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Connect your YouTube account to verify your creator status and unlock the ability to launch your own meme coin.
          </p>
        </motion.div>
        
        <SocialVerification />
        
        {/* Make sure this button is rendering by removing any conditional that might prevent it */}
        {connected && publicKey && creatorData?.youtube_username && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={() => navigate("/create-meme-coin")}
              className="bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90 px-6 py-6 text-lg"
            >
              <Coins className="mr-2" /> Create Your Meme Coin
            </Button>
            <p className="text-sm text-gray-400 mt-2">You're verified! Create and launch your own meme coin on Solana.</p>
          </motion.div>
        )}
        
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Verify;
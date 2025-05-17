
import React, { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GamerShowcase from "@/components/GamerShowcase";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { getVerificationStatus } from "@/utils/getVerificationStatus";

const Index = () => {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [eligibleForMemeCoin, setEligibleForMemeCoin] = useState(false);
  
  useEffect(() => {
    if (connected && publicKey) {
      checkEligibility();
    } else {
      setEligibleForMemeCoin(false);
    }
  }, [connected, publicKey]);
  
  const checkEligibility = async () => {
    if (!publicKey) return;
    
    try {
      const { data } = await supabase
        .from('creators')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .maybeSingle();
      
      if (data) {
        // Check eligibility for meme coin
        const status = getVerificationStatus(data?.youtube_subscribers);
        setEligibleForMemeCoin(status.eligibleForMemeCoin);
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-game-black text-white overflow-x-hidden">
      <Hero />
      
      <Features />
      <GamerShowcase />
      <WaitlistForm />
      <Footer />
    </div>
  );
};

export default Index;

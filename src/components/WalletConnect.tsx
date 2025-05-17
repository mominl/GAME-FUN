
import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const WalletConnect: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const [userTokenId, setUserTokenId] = useState<string | null>(null);

  // Navigate to wallet-specific dashboard
  const navigateToDashboard = () => {
    if (publicKey) {
      navigate(`/dashboard/wallet/${publicKey.toBase58()}`);
    } else {
      navigate("/dashboard");
    }
  };
  
  return (
    <motion.div 
      className="absolute top-6 right-6 z-50 sm:right-10 md:right-16 flex items-center gap-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {connected && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <Button
            onClick={navigateToDashboard}
            className="font-orbitron text-sm md:text-base bg-[#512da8] text-white rounded-sm px-6 py-6 
            backdrop-blur-md shadow-[0_0_15px_rgba(155,135,245,0.5)] 
            hover:shadow-[0_0_20px_rgba(155,135,245,0.8)] hover:text-neon-purple transition-all"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </motion.div>
      )}
      
      <motion.div whileHover={{ scale: 1.05 }}>
        <WalletMultiButton className={`
          font-orbitron text-sm md:text-base 
          ${connected ? 'bg-neon-purple/90' : 'bg-neon-purple'} 
          text-white rounded-full px-4 py-2 
          backdrop-blur-md shadow-[0_0_15px_rgba(155,135,245,0.5)] 
          hover:shadow-[0_0_20px_rgba(155,135,245,0.8)] transition-all
        `} />      </motion.div>
    </motion.div>
  );
};

export default WalletConnect;

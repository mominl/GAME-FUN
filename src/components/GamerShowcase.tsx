
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "@/components/ui/use-toast";

interface GamerProfileProps {
  avatar: string;
  name: string;
  coinName: string;
  followers: string;
  index: number;
}

const GamerProfile: React.FC<GamerProfileProps> = ({ 
  avatar, 
  name, 
  coinName,
  followers,
  index 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card overflow-hidden"
    >
      <div className="h-40 bg-gradient-to-r from-game-mid to-game-light relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')] opacity-30 bg-cover bg-center"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>
      <div className="p-6 relative">
        <div className="absolute -top-10 left-6 w-20 h-20 rounded-full border-4 border-game-black overflow-hidden">
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-orbitron text-lg">{name}</h3>
            <span className="text-xs text-neon-purple bg-neon-purple/10 px-2.5 py-1 rounded-full">
              {followers} followers
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink"></div>
            <span className="text-gray-400 text-sm">${coinName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Meme coin launched</span>
            <span className="text-neon-green">+24% this week</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GamerShowcase: React.FC = () => {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  
  const handleClaimIdentity = () => {
    if (!connected || !publicKey) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Navigating to verify page");
    navigate("/verify");
  };
  
  const gamers = [
    {
      avatar: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      name: "NeonHunter",
      coinName: "NEON",
      followers: "345K"
    },
    {
      avatar: "https://images.unsplash.com/photo-1612392166886-ee8475b03af2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      name: "CryptoGamer",
      coinName: "CRYP",
      followers: "1.2M"
    },
    {
      avatar: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      name: "PixelQueen",
      coinName: "PIXL",
      followers: "890K"
    },
    {
      avatar: "https://images.unsplash.com/photo-1596075780750-81249df16d19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      name: "MemeWizard",
      coinName: "WIZA",
      followers: "750K"
    },
  ];

  return (
    <section className="py-24 px-4 relative bg-game-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(155,135,245,0.15)_0,rgba(15,12,41,0)_70%)]"></div>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-4 neon-text">
            Top <span className="neon-purple-text">Gamers</span> Already Here
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join these gaming influencers who have already launched their meme coins and communities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {gamers.map((gamer, index) => (
            <GamerProfile
              key={index}
              avatar={gamer.avatar}
              name={gamer.name}
              coinName={gamer.coinName}
              followers={gamer.followers}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Button 
            className="bg-neon-green hover:bg-neon-green/80 text-game-black font-medium px-8 py-6 rounded-full text-lg font-orbitron transition-all duration-300 shadow-[0_0_20px_rgba(0,255,140,0.4)]"
            onClick={handleClaimIdentity}
          >
            CLAIM YOUR IDENTITY
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default GamerShowcase;

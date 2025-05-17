
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Gamepad } from "lucide-react";
import WalletConnect from './WalletConnect';
import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
  };

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden hero-gradient bg-grid">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,135,245,0.15)_0,rgba(15,12,41,0)_70%)]"></div>
      
      {/* Wallet Connect Button */}
      <WalletConnect />
      
      <motion.div
        variants={container}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
        className="container mx-auto px-4 py-12 text-center z-10"
      >
        <motion.div variants={item}>
          <div className="flex items-center justify-center mb-6">
            <Gamepad className="h-10 w-10 text-neon-purple mr-2" />
            <span className="font-orbitron text-xl tracking-widest neon-purple-text">GAME.FUN</span>
          </div>
        </motion.div>

        <motion.h1 
          variants={item}
          className="text-4xl md:text-5xl lg:text-7xl font-orbitron font-bold mb-6 neon-text"
        >
          Launch Your <span className="neon-purple-text">Gamer</span> Meme Coin on Solana
        </motion.h1>

        <motion.p 
          variants={item}
          className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-gray-300"
        >
          Create. Trade. Meme your Identity.
        </motion.p>

        <motion.div variants={item}>
          {/* <Button 
            className="bg-neon-purple hover:bg-neon-purple/80 text-white px-8 py-6 rounded-full text-lg font-orbitron transition-all duration-300 animate-pulse shadow-[0_0_20px_rgba(155,135,245,0.5)]"
            onClick={() => {
              const waitlistSection = document.getElementById('waitlist');
              waitlistSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            JOIN THE DROP
          </Button> */}

           
                    <Button
                      onClick={() => navigate("/verify")}
                      className="bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:opacity-90"
                    >
                      <Coins className="mr-2" /> Get Started
                    </Button>
                  
        </motion.div>

        <motion.div 
          variants={item}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-1 animate-pulse"></div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;

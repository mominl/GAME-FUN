
import React from "react";
import { Gamepad } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 bg-game-black border-t border-white/5">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <Gamepad className="h-6 w-6 text-neon-purple mr-2" />
            <span className="font-orbitron text-lg tracking-widest neon-purple-text">GAME.FUN</span>
          </div>
          
          <div className="flex space-x-6 mb-6 md:mb-0">
            <a href="https://x.com/Mustafa3Murtuza" className="text-gray-400 hover:text-neon-purple transition-colors">
              Twitter
            </a>
            <a href="https://discord.gg/xGKSA38Y" className="text-gray-400 hover:text-neon-purple transition-colors">
              Discord
            </a>
            <a href="#" className="text-gray-400 hover:text-neon-purple transition-colors">
              Medium
            </a>
            <a href="https://github.com/mominl" className="text-gray-400 hover:text-neon-purple transition-colors">
              GitHub
            </a>
          </div>
          
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Game.fun. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

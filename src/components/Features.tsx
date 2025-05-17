
import React from "react";
import { motion } from "framer-motion";
import { Rocket, Gamepad, Tv, Dice6 } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: delay * 0.2 }}
      className="glass-card p-6 md:p-8 flex flex-col items-center"
    >
      <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-6 animate-float">
        <div className="text-neon-purple">{icon}</div>
      </div>
      <h3 className="font-orbitron text-xl mb-3 neon-text">{title}</h3>
      <p className="text-gray-400 text-center">{description}</p>
    </motion.div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Rocket size={32} />,
      title: "Instant Coin Creation",
      description: "Launch your own meme coin in seconds. No coding required.",
      delay: 0,
    },
    {
      icon: <Gamepad size={32} />,
      title: "Gamer Profiles",
      description: "Build your on-chain gamer identity with achievements and stats.",
      delay: 1,
    },
    {
      icon: <Tv size={32} />,
      title: "Stream Integration",
      description: "Connect with your favorite streaming platforms seamlessly.",
      delay: 2,
    },
    {
      icon: <Dice6 size={32} />,
      title: "Meme Economy",
      description: "Trade, collect and earn from the gaming meme ecosystem.",
      delay: 3,
    },
  ];

  return (
    <section className="py-24 px-4 relative bg-game-black bg-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,140,0.1)_0,rgba(15,12,41,0)_70%)]"></div>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold mb-4 neon-text">
            The <span className="neon-green-text">Future</span> of Gaming
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Game.fun combines meme coins with gaming culture, creating a new way for gamers to monetize their identity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

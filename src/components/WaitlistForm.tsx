
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const WaitlistForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting to waitlist:", email);
      
      // Insert the email into the Supabase waitlist table
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, created_at: new Date().toISOString() }]);
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      toast.success("You're on the waitlist! We'll notify you when we launch.");
      setEmail("");
    } catch (error) {
      console.error("Error submitting to waitlist:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 px-4 relative bg-game-black bg-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,135,245,0.2)_0,rgba(15,12,41,0)_70%)]"></div>
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h2 className="font-orbitron text-3xl font-bold mb-4 neon-text">
                Join The <span className="neon-purple-text">Waitlist</span>
              </h2>
              <p className="text-gray-400">
                Be among the first to create your gaming meme coin when we launch.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/5 border-white/10 px-4 py-6 rounded-lg text-white placeholder:text-gray-500 focus:border-neon-purple focus:ring-neon-purple/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-neon-purple hover:bg-neon-purple/80 text-white px-4 py-6 rounded-lg text-lg font-orbitron transition-all duration-300 shadow-[0_0_10px_rgba(155,135,245,0.5)]"
              >
                {isSubmitting ? "Submitting..." : "GET EARLY ACCESS"}
              </Button>
            </form>
            
            <p className="text-center text-xs text-gray-500 mt-6">
              By joining, you agree to receive updates about Game.fun. No spam, ever.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistForm;

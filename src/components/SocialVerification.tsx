
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import WalletConnect from './WalletConnect';

interface SocialVerificationProps {
  onVerify?: (verified: boolean) => void;
}

const SocialVerification: React.FC<SocialVerificationProps> = ({ onVerify }) => {
  const { publicKey, connected } = useWallet();
  const [creatorData, setCreatorData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const walletAddress = publicKey?.toBase58() || '';

  useEffect(() => {
    if (connected && walletAddress) {
      fetchCreatorData();
    } else {
      setCreatorData(null);
    }
  }, [connected, walletAddress]);

  const fetchCreatorData = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // Use maybeSingle instead of single to avoid errors when no data is found
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching creator data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch verification data",
          variant: "destructive",
        });
      } else {
        console.log("Creator data:", data);
        setCreatorData(data);
        if (data?.verified && onVerify) {
          onVerify(true);
        }
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectYouTube = () => {
    if (!connected || !walletAddress) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // YouTube OAuth URL
    const youtubeClientId = "355324126045-90gukff53jfpar1g3nge9vc912j1tpt3.apps.googleusercontent.com";
    const redirectUri = `${window.location.origin}/api/auth/youtube`;
    const scope = "https://www.googleapis.com/auth/youtube.readonly";
    
    // Store the wallet address in state parameter to pass it through the OAuth flow
    const state = walletAddress;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${youtubeClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&state=${state}`;
    
    console.log("Redirecting to YouTube OAuth:", authUrl);
    window.location.href = authUrl;
  };

  const hasVerification = creatorData?.verified;
  const youtubeVerified = creatorData?.youtube_verified;

  return (
    <div className="glass-card p-6 rounded-xl max-w-xl mx-auto">
      <h3 className="font-orbitron text-xl mb-4 neon-text text-center">Verify Your Creator Identity</h3>
      
      {!connected && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">Please connect your wallet first</span>
          </div>
          <div className="flex justify-center">
            <WalletConnect />
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {hasVerification ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-orbitron text-green-500 text-lg">Verified Creator</span>
            </div>
          </div>
        ) : null}

        <div className="border border-[#FF0000]/30 bg-[#FF0000]/10 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#FF0000]" fill="currentColor">
                <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" />
              </svg>
              <span className="ml-2 font-medium">YouTube</span>
            </div>
            
            {youtubeVerified ? (
              <div className="flex items-center">
                <span className="text-xs text-green-400 mr-2">Verified</span>
                <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ) : null}
          </div>
          
          {creatorData?.youtube_username ? (
            <div className="mt-3">
              <div className="flex items-center">
                <img 
                  src={creatorData.youtube_profile_image} 
                  alt={creatorData.youtube_username}
                  className="w-10 h-10 rounded-full mr-3" 
                />
                <div>
                  <div className="font-medium">{creatorData.youtube_username}</div>
                  <div className="text-xs text-gray-400">{creatorData.youtube_subscribers.toLocaleString()} subscribers</div>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleConnectYouTube}
              className="mt-3 bg-[#FF0000] hover:bg-[#FF0000]/80 text-white w-full"
              disabled={loading || !connected}
            >
              {loading ? 
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span> 
                : 'Connect YouTube'
              }
            </Button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p className="mb-2">Verification Requirements:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>YouTube: 1,000+ subscribers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SocialVerification;

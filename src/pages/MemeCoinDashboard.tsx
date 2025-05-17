import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Coins,
  BadgeCheck,
  Copy,
  ExternalLink,
  Share2,
  Twitter,
  Youtube,
  ArrowUpRight,
  AreaChart,
  Flame,
  PlusCircle,
  Pencil,
  Send,
  Wallet,
  Users,
  Clock,
  ListEnd,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data for the chart
const generateChartData = (days: number) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let price = 0.0001;
  
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Create some random price movement
    const change = (Math.random() - 0.3) * 0.00002;
    price = Math.max(0.00001, price + change);
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      price: price,
    });
  }
  
  return data;
};

// Mock data for transactions
const mockTransactions = [
  { address: "GXuBw9tEiNXshW9u61dqZKirU3qdEMBbNs...", type: "Buy", amount: "2,500,000", time: "5 mins ago" },
  { address: "8wUmX4fMZMDBh7PZxD3LKx31NfNnUU...", type: "Sell", amount: "500,000", time: "12 mins ago" },
  { address: "AeCZhKvhkLTw8qdNJz1PrKUETvKMJ...", type: "Transfer", amount: "1,000,000", time: "27 mins ago" },
  { address: "Gq7GDXnSh5qiPT8M3kmsLUgCpH7t...", type: "Buy", amount: "750,000", time: "1 hour ago" },
  { address: "HaLYNuA44xpHMQeY4KJgLs56XcZ...", type: "Buy", amount: "3,000,000", time: "2 hours ago" },
];

interface MemeCoin {
  id?: string;
  creator_wallet_address: string;
  name: string;
  symbol: string;
  initial_supply: number;
  starting_price: number;
  price_unit: string;
  description: string;
  token_mint_address: string;
  created_at?: string;
}

const MemeCoinDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();  const [loading, setLoading] = useState(true);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [coinData, setCoinData] = useState<MemeCoin | null>(null);
  const [userCoins, setUserCoins] = useState<MemeCoin[]>([]);
  const [chartPeriod, setChartPeriod] = useState("7d");
  const [chartData, setChartData] = useState<any[]>([]);
  const [airdropAddress, setAirdropAddress] = useState("");
  const [airdropAmount, setAirdropAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  
  // Simulated token metrics
  const [circulatingSupply, setCirculatingSupply] = useState(0);
  const [marketCap, setMarketCap] = useState(0);
  const [holdersCount, setHoldersCount] = useState(0);
  const { tokenId } = useParams();
  useEffect(() => {
    if (connected && publicKey) {
      fetchCreatorData();
      // If we have a specific tokenId in the URL, fetch that coin's data
      if (tokenId) {
        fetchCoinData(tokenId);
      } else {
        // Otherwise, fetch all of the user's coins
        fetchUserCoins();
      }
    } else {
      setLoading(false);
    }
  }, [connected, publicKey, tokenId]);

  useEffect(() => {
    // Update chart data when period changes
    let days = 7;
    if (chartPeriod === "24h") days = 1;
    if (chartPeriod === "7d") days = 7;
    if (chartPeriod === "30d") days = 30;
    
    setChartData(generateChartData(days));
  }, [chartPeriod]);

  useEffect(() => {
    // Calculate metrics when coin data is available
    if (coinData) {
      // Simulated metrics
      setCirculatingSupply(coinData.initial_supply * 0.85); // 85% in circulation
      setMarketCap(coinData.initial_supply * coinData.starting_price);
      setHoldersCount(Math.floor(Math.random() * 200) + 10); // Random number between 10-210
    }
  }, [coinData]);

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
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    }
  };
  // Fetch a specific coin by token mint address
  const fetchCoinData = async (tokenMintAddress: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('meme_coins')
        .select('*')
        .eq('token_mint_address', tokenMintAddress)
        .single();

      if (error) {
        throw error;
      }
      
      if (data) {
        setCoinData(data as MemeCoin);
        console.log('Fetched specific coin data:', data);
      } else {
        // If no data found, show error
        toast({
          title: "Coin not found",
          description: "The requested meme coin could not be found",
          variant: "destructive",
        });
        navigate('/dashboard'); // Redirect to dashboard
      }
    } catch (error) {
      console.error('Error fetching coin data:', error);
      toast({
        title: "Error",
        description: "Failed to load meme coin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all meme coins created by the current user
  const fetchUserCoins = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('meme_coins')
        .select('*')
        .eq('creator_wallet_address', publicKey.toBase58());
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setUserCoins(data as MemeCoin[]);
        console.log('Fetched user coins:', data);
        
        // If there's at least one coin, set the current coin data to the first one
        if (data.length > 0) {
          setCoinData(data[0] as MemeCoin);
        }
      }
    } catch (error) {
      console.error('Error fetching user meme coins:', error);
      toast({
        title: "Error",
        description: "Failed to load your meme coins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAirdrop = () => {
    if (!airdropAddress || !airdropAmount) {
      toast({
        title: "Error",
        description: "Please enter both address and amount",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate airdrop process
    toast({
      title: "Processing Airdrop",
      description: "Please wait while we process your request...",
    });
    
    setTimeout(() => {
      toast({
        title: "Airdrop Successful",
        description: `Airdropped ${airdropAmount} $${coinData?.symbol} to ${airdropAddress.substring(0, 10)}...`,
      });
      setAirdropAddress("");
      setAirdropAmount("");
    }, 2000);
  };

  const handleBurn = () => {
    if (!burnAmount) {
      toast({
        title: "Error",
        description: "Please enter amount to burn",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate burn process
    toast({
      title: "Processing Burn",
      description: "Please wait while we process your request...",
    });
    
    setTimeout(() => {
      toast({
        title: "Tokens Burned",
        description: `Successfully burned ${burnAmount} $${coinData?.symbol}`,
      });
      setBurnAmount("");
      
      // Update circulating supply
      if (coinData) {
        setCirculatingSupply(prev => Math.max(0, prev - Number(burnAmount)));
      }
    }, 2000);
  };

  const handleMint = () => {
    if (!mintAmount) {
      toast({
        title: "Error",
        description: "Please enter amount to mint",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate mint process
    toast({
      title: "Processing Mint",
      description: "Please wait while we process your request...",
    });
    
    setTimeout(() => {
      toast({
        title: "Tokens Minted",
        description: `Successfully minted ${mintAmount} $${coinData?.symbol}`,
      });
      setMintAmount("");
      
      // Update circulating supply
      if (coinData) {
        setCirculatingSupply(prev => prev + Number(mintAmount));
      }
    }, 2000);
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: message,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-game-black text-white py-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(155,135,245,0.15)_0,rgba(15,12,41,0)_70%)]"></div>
      <div className="absolute inset-0 bg-grid"></div>
     
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-orbitron text-4xl md:text-5xl font-bold mb-4 neon-text">
            <Coins className="inline-block mr-2 mb-1" /> 
            Meme Coin <span className="neon-purple-text">Dashboard</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Manage and track your meme coin on the Solana blockchain.
          </p>
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-neon-purple border-t-transparent rounded-full"></div>
          </div>
        ) : !connected ? (
          <div className="glass-card p-8 max-w-xl mx-auto text-center">
            <h3 className="font-orbitron text-xl mb-4">Connect Your Wallet</h3>
            <p className="mb-6 text-gray-400">Please connect your wallet to view your dashboard.</p>
          </div>
        ) : !coinData ? (
          <div className="glass-card p-8 max-w-xl mx-auto text-center">
            <h3 className="font-orbitron text-xl mb-4">No Coin Found</h3>
            <p className="mb-6 text-gray-400">We couldn't find the requested coin. Create a new one?</p>
            <Button 
              onClick={() => navigate("/create-meme-coin")}
              className="bg-neon-purple hover:bg-neon-purple/80"
            >
              Create Meme Coin
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Coin Selection Dropdown (Only shown when user has multiple coins) */}
            {userCoins.length > 1 && !tokenId && (
              <div className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-neon-purple" />
                  <span>Your Meme Coins: {userCoins.length}</span>
                </div>
                <Select
                  value={coinData?.token_mint_address}
                  onValueChange={(value) => {
                    const selected = userCoins.find(coin => coin.token_mint_address === value);
                    if (selected) setCoinData(selected);
                  }}
                >
                  <SelectTrigger className="w-[250px] bg-black/60">
                    <SelectValue placeholder="Select Coin" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-neon-purple/20">
                    {userCoins.map((coin) => (
                      <SelectItem key={coin.token_mint_address} value={coin.token_mint_address}>
                        {coin.name} ({coin.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    // Refresh the user's coins
                    fetchUserCoins();
                    toast({
                      title: "Refreshed",
                      description: "Your meme coins data has been updated",
                    });
                  }}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </div>
            )}
            
            {/* Creator Info and Token Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Creator Info */}
              <div className="md:col-span-1">
                <Card className="border-neon-purple/20 bg-black/40 backdrop-blur-sm h-full">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Creator Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-4 border-2 border-neon-purple/50">
                        <AvatarImage src={creatorData?.youtube_profile_image} />
                        <AvatarFallback className="bg-neon-purple/20 text-neon-purple">
                          {creatorData?.youtube_username?.substring(0, 2).toUpperCase() || "YT"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="mb-4">
                        <h3 className="font-orbitron text-lg">{creatorData?.youtube_username || "Creator"}</h3>
                        
                        <div className="flex items-center justify-center mt-1">
                          <Badge className="bg-[#FF0000] text-white flex items-center">
                            <Youtube size={10} className="mr-1" /> Verified Creator
                          </Badge>
                        </div>
                        
                        {creatorData?.youtube_subscribers && (
                          <p className="text-sm text-gray-400 mt-1">
                            {creatorData.youtube_subscribers.toLocaleString()} subscribers
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-gray-900 p-3 rounded-md w-full mb-4">
                        <div className="text-gray-400 text-xs mb-1">Wallet Address:</div>
                        <div className="flex items-center">
                          <span className="text-neon-purple/80 font-mono text-sm truncate">
                            {publicKey?.toBase58().substring(0, 15)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-6 w-6 p-0"
                            onClick={() => copyToClipboard(
                              publicKey?.toBase58() || "", 
                              "Wallet address copied to clipboard"
                            )}
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 w-full"
                        onClick={() => navigate("/create-meme-coin")}
                      >
                        <PlusCircle size={14} className="mr-2" /> Create Another Coin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Token Overview */}
              <div className="md:col-span-2">
                <Card className="border-neon-purple/20 bg-black/40 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-orbitron">
                        {coinData.name} <span className="text-neon-purple">${coinData.symbol}</span>
                      </CardTitle>
                      <CardDescription>Token Overview</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                        onClick={() => {
                          const text = `Check out my meme coin ${coinData.name} (${coinData.symbol}) on Solana!`;
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                      >
                        <Twitter size={14} className="mr-1" /> Share
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                        onClick={() => window.open(`https://explorer.solana.com/address/${coinData.token_mint_address}`, '_blank')}
                      >
                        <ExternalLink size={14} className="mr-1" /> Explorer
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Mint Address</div>
                        <div className="flex items-center">
                          <span className="text-neon-purple/80 font-mono text-sm truncate">
                            {coinData.token_mint_address.substring(0, 12)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-6 w-6 p-0"
                            onClick={() => copyToClipboard(
                              coinData.token_mint_address, 
                              "Token mint address copied to clipboard"
                            )}
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Total Supply</div>
                        <div className="font-semibold">
                          {coinData.initial_supply.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Circulating Supply</div>
                        <div className="font-semibold">
                          {circulatingSupply.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Launch Price</div>
                        <div className="font-semibold">
                          {coinData.starting_price} {coinData.price_unit}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Market Cap</div>
                        <div className="font-semibold">
                          {marketCap.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {coinData.price_unit}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Holders</div>
                        <div className="font-semibold">
                          {holdersCount}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Launch Date</div>
                        <div className="font-semibold">
                          {formatDate(coinData.created_at)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-gray-400 text-xs">Network</div>
                        <div className="font-semibold">
                          Solana
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        className="bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90"
                        onClick={() => {
                          toast({
                            title: "Added to Wallet",
                            description: `${coinData.symbol} token has been added to your wallet`,
                          });
                        }}
                      >
                        <Wallet size={14} className="mr-2" /> Add to Wallet
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                        onClick={() => window.open('https://jup.ag', '_blank')}
                      >
                        <ArrowUpRight size={14} className="mr-2" /> View Liquidity
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                      >
                        <Share2 size={14} className="mr-2" /> Get Embed Code
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                      >
                        <ListEnd size={14} className="mr-2" /> Add to Watchlist
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Chart Section */}
            <Card className="border-neon-purple/20 bg-black/40 backdrop-blur-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="font-orbitron">
                  <AreaChart className="inline-block mr-2 mb-1" /> 
                  Price Chart
                </CardTitle>
                <div className="flex mt-2 sm:mt-0">
                  <Tabs value={chartPeriod} onValueChange={setChartPeriod}>
                    <TabsList className="bg-gray-900">
                      <TabsTrigger value="24h">
                        24h
                      </TabsTrigger>
                      <TabsTrigger value="7d">
                        7d
                      </TabsTrigger>
                      <TabsTrigger value="30d">
                        30d
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#999"
                        tick={{ fill: '#999' }}
                      />
                      <YAxis 
                        stroke="#999"
                        tick={{ fill: '#999' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          borderColor: 'rgba(155,135,245,0.5)', 
                          color: '#fff' 
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#9b87f5"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Latest Transactions & Creator Tools */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Latest Transactions */}
              <Card className="border-neon-purple/20 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-orbitron">
                    <Clock className="inline-block mr-2 mb-1" /> 
                    Latest Transactions
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {mockTransactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            tx.type === "Buy" ? "bg-green-400" : 
                            tx.type === "Sell" ? "bg-red-400" : "bg-blue-400"
                          }`} />
                          <div>
                            <div className="text-sm font-semibold">
                              {tx.type === "Buy" ? "Purchase" : tx.type === "Sell" ? "Sale" : "Transfer"}
                            </div>
                            <div className="text-xs text-gray-400">{tx.address}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-mono">{tx.amount}</div>
                          <div className="text-xs text-gray-400">{tx.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10"
                      onClick={() => window.open(`https://explorer.solana.com/address/${coinData.token_mint_address}`, '_blank')}
                    >
                      <ExternalLink size={14} className="mr-2" /> View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Creator Tools */}
              <Card className="border-neon-purple/20 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-orbitron">
                    Creator Tools
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="airdrop" className="space-y-4">
                    <TabsList className="w-full bg-gray-900">
                      <TabsTrigger value="airdrop" className="flex-1">Airdrop</TabsTrigger>
                      <TabsTrigger value="burn" className="flex-1">Burn</TabsTrigger>
                      <TabsTrigger value="mint" className="flex-1">Mint More</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="airdrop" className="space-y-4">
                      <div>
                        <Label htmlFor="airdrop-address">Recipient Address</Label>
                        <Input
                          id="airdrop-address"
                          placeholder="e.g. AbCdEf123..."
                          value={airdropAddress}
                          onChange={(e) => setAirdropAddress(e.target.value)}
                          className="mt-1 border-neon-purple/30"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="airdrop-amount">Amount</Label>
                        <Input
                          id="airdrop-amount"
                          type="number"
                          placeholder="e.g. 1000"
                          value={airdropAmount}
                          onChange={(e) => setAirdropAmount(e.target.value)}
                          className="mt-1 border-neon-purple/30"
                        />
                      </div>
                      
                      <Button
                        className="bg-neon-purple hover:bg-neon-purple/80 w-full"
                        onClick={handleAirdrop}
                      >
                        <Send size={14} className="mr-2" /> Send Airdrop
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="burn" className="space-y-4">
                      <div>
                        <Label htmlFor="burn-amount">Amount to Burn</Label>
                        <Input
                          id="burn-amount"
                          type="number"
                          placeholder="e.g. 1000"
                          value={burnAmount}
                          onChange={(e) => setBurnAmount(e.target.value)}
                          className="mt-1 border-neon-purple/30"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Burning tokens permanently removes them from circulation.
                        </p>
                      </div>
                      
                      <Button
                        className="bg-red-500 hover:bg-red-600 w-full"
                        onClick={handleBurn}
                      >
                        <Flame size={14} className="mr-2" /> Burn Tokens
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="mint" className="space-y-4">
                      <div>
                        <Label htmlFor="mint-amount">Amount to Mint</Label>
                        <Input
                          id="mint-amount"
                          type="number"
                          placeholder="e.g. 1000"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          className="mt-1 border-neon-purple/30"
                        />
                        <p className="text-xs text-red-400 mt-1">
                          Warning: Minting additional tokens can dilute token value.
                        </p>
                      </div>
                      
                      <Button
                        className="bg-neon-purple hover:bg-neon-purple/80 w-full"
                        onClick={handleMint}
                      >
                        <PlusCircle size={14} className="mr-2" /> Mint New Tokens
                      </Button>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-6 border-t border-gray-800 pt-6">
                    <h4 className="font-orbitron text-sm mb-4">Additional Tools</h4>
                    
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 w-full justify-start text-sm"
                      >
                        <Pencil size={14} className="mr-2" /> Update Token Metadata
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 w-full justify-start text-sm"
                      >
                        <Users size={14} className="mr-2" /> View Token Holders
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeCoinDashboard;
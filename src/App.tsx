import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";
import YoutubeCallback from "./pages/YoutubeCallback";
import CreateMemeCoin from "./pages/CreateMemeCoin";
import MemeCoinDashboard from "./pages/MemeCoinDashboard";
import { WalletContextProvider } from "./lib/walletContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WalletContextProvider>
        <BrowserRouter>          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/create-meme-coin" element={<CreateMemeCoin />} />
            <Route path="/dashboard/:tokenId" element={<MemeCoinDashboard />} />
            <Route path="/dashboard/wallet/:walletAddress" element={<MemeCoinDashboard />} />
            <Route path="/dashboard" element={<MemeCoinDashboard />} />
            <Route path="/api/auth/youtube" element={<YoutubeCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

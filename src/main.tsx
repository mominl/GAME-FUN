import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WalletContextProvider } from './lib/walletContext.tsx'
// Polyfill for Buffer needed by some Solana packages
import { Buffer } from 'buffer'
window.Buffer = Buffer

createRoot(document.getElementById("root")!).render(
  <WalletContextProvider>
    <App />
  </WalletContextProvider>
);

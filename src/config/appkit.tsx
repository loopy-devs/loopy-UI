import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solana, solanaDevnet } from '@reown/appkit/networks';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import type { ReactNode } from 'react';

// Get project ID from env (you'll need to get this from https://cloud.reown.com)
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'demo-project-id';

// Solana adapter setup
const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
});

// App metadata
const metadata = {
  name: 'Loopy',
  description: 'Private Solana Wallet & Swap',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://loopy.xyz',
  icons: ['https://loopy.xyz/icon.png'],
};

// Create AppKit instance
createAppKit({
  adapters: [solanaWeb3JsAdapter],
  networks: [solana, solanaDevnet],
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#2D5BFF',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#2D5BFF',
    '--w3m-border-radius-master': '12px',
  },
});

export function AppKitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

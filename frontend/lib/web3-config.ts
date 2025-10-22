import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia, localhost } from 'wagmi/chains'
import { http } from 'viem'
import { createStorage, noopStorage } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'Web3 Crowdfunding',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [localhost, baseSepolia, base],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org'),
  },
  // Disable SSR to prevent hydration issues
  ssr: false,
  // Use session storage instead of local storage to prevent auto-reconnection on new sessions
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.sessionStorage : noopStorage,
  }),
})

export const SUPPORTED_CHAINS = [localhost, baseSepolia, base]
export const DEFAULT_CHAIN = localhost


import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { localhost } from 'wagmi/chains'
import { http } from 'viem'
import { createStorage, noopStorage } from 'wagmi'

// Define Lisk networks
const liskSepolia = {
  id: 4202,
  name: 'Lisk Sepolia',
  network: 'lisk-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Indonesian Rupiah X',
    symbol: 'IDRX',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia-api.lisk.com'],
    },
    public: {
      http: ['https://rpc.sepolia-api.lisk.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Lisk Sepolia Explorer', url: 'https://sepolia-blockscout.lisk.com' },
  },
  testnet: true,
}

const lisk = {
  id: 1135,
  name: 'Lisk',
  network: 'lisk',
  nativeCurrency: {
    decimals: 18,
    name: 'Indonesian Rupiah X',
    symbol: 'IDRX',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.api.lisk.com'],
    },
    public: {
      http: ['https://rpc.api.lisk.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Lisk Explorer', url: 'https://blockscout.lisk.com' },
  },
  testnet: false,
}

export const config = getDefaultConfig({
  appName: 'Lisk Crowdfunding',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [localhost, liskSepolia, lisk],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
    [liskSepolia.id]: http(process.env.NEXT_PUBLIC_LISK_SEPOLIA_RPC_URL || 'https://rpc.sepolia-api.lisk.com'),
    [lisk.id]: http(process.env.NEXT_PUBLIC_LISK_MAINNET_RPC_URL || 'https://rpc.api.lisk.com'),
  },
  // Disable SSR to prevent hydration issues
  ssr: false,
  // Use session storage instead of local storage to prevent auto-reconnection on new sessions
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.sessionStorage : noopStorage,
  }),
})

export const SUPPORTED_CHAINS = [localhost, liskSepolia, lisk]
export const DEFAULT_CHAIN = liskSepolia


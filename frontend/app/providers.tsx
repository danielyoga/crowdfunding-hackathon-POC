'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/web3-config'
import { Toaster } from 'sonner'
import { MockRoleProvider } from '@/contexts/MockRoleContext'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  // Disable Web3 providers in mock mode to prevent configuration errors
  return (
    <QueryClientProvider client={queryClient}>
      <MockRoleProvider>
        {children}
        <Toaster position="top-right" />
      </MockRoleProvider>
    </QueryClientProvider>
  )
}


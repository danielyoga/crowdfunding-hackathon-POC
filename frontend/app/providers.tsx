'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/web3-config'
import { Toaster, toast } from 'sonner'
import { MockRoleProvider } from '@/contexts/MockRoleContext'
import { detectAndCleanStaleData } from '@/lib/storage-cleanup'
import { ethers } from 'ethers'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

function StorageCleanupWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const checkAndCleanStorage = async () => {
      try {
        // Check if we're on localhost
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
        if (!rpcUrl.includes('127.0.0.1') && !rpcUrl.includes('localhost')) {
          return; // Skip cleanup on non-localhost networks
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const result = await detectAndCleanStaleData(chainId, provider);
        
        if (result.wasCleared) {
          console.log(`🧹 Cleaned stale campaign data: ${result.reason}`);
          toast.info('Detected Hardhat restart - cleared old campaign data', {
            duration: 3000,
          });
        }
      } catch (error) {
        console.warn('Storage cleanup check failed:', error);
      }
    };

    checkAndCleanStorage();
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MockRoleProvider>
        <StorageCleanupWrapper>
          {children}
        </StorageCleanupWrapper>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              marginTop: '4.5rem', // 72px - slightly below the 64px navbar
            },
          }}
        />
      </MockRoleProvider>
    </QueryClientProvider>
  )
}


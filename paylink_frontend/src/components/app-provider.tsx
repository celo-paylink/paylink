import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css';
import { config } from '../libs/config';
import { initializeFarcasterSDK } from '../libs/farcaster-sdk';

const queryClient = new QueryClient()

export default function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Farcaster SDK once the app has mounted
    initializeFarcasterSDK();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
import '@rainbow-me/rainbowkit/styles.css'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { createConfig, http } from 'wagmi';
import { celo } from 'wagmi/chains';

// Create RainbowKit connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'Paylink',
    projectId: "7b20fbb4bba28015e2d4ddfbe5d08a43",
  }
);

export const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
  connectors: [
    ...connectors,
    farcasterMiniApp(), // Add Farcaster connector
  ],
  ssr: true,
})

import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { http } from 'viem';
import { celo } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Paylink',
  projectId: "7b20fbb4bba28015e2d4ddfbe5d08a43",
  chains: [
    celo
  ],
  transports: {
    [celo.id]: http(),
  },
  wallets: [
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
  ssr: true,
})

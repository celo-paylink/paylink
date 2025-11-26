import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem';
import { celo } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Minth',
  projectId: "7b20fbb4bba28015e2d4ddfbe5d08a43",
  chains: [
    celo
  ],
  transports: {
    [celo.id]: http(),
  },
  ssr: true,
})

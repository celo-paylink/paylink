import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem';
import { celoAlfajores } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'My Celo DApp',
  projectId: "7b20fbb4bba28015e2d4ddfbe5d08a43",
  chains: [
    celoAlfajores
  ],
  transports: {
    [celoAlfajores.id]: http(),
  },
  ssr: true,
})

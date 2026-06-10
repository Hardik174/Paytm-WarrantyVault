import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'PaytmWarranty Protocol',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'paytm-warranty-demo',
  chains: [sepolia],
  ssr: false,
})

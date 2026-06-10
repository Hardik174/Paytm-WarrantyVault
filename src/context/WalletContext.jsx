import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAccount, useConnect, useDisconnect, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { publicClientToProvider, walletClientToSigner } from '../lib/ethersAdapter'
import { SEPOLIA_CHAIN_ID } from '../lib/mockData'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const { address, chainId, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()

  const [signer, setSigner] = useState(null)
  const [provider, setProvider] = useState(null)

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID
  const connecting = isConnecting || isReconnecting || isConnectPending

  useEffect(() => {
    if (walletClient) {
      setSigner(walletClientToSigner(walletClient))
    } else {
      setSigner(null)
    }
  }, [walletClient])

  useEffect(() => {
    if (publicClient) {
      setProvider(publicClientToProvider(publicClient))
    } else {
      setProvider(null)
    }
  }, [publicClient])

  const connectWallet = useCallback(() => {
    const metaMask = connectors.find(
      (c) => c.id === 'metaMask' || c.id === 'metaMaskSDK' || c.name === 'MetaMask'
    )
    const connector = metaMask || connectors[0]
    if (connector) {
      connect({ connector, chainId: SEPOLIA_CHAIN_ID })
    }
  }, [connect, connectors])

  const switchToSepolia = useCallback(() => {
    switchChain({ chainId: sepolia.id })
  }, [switchChain])

  const value = useMemo(
    () => ({
      address: address ?? null,
      signer,
      provider,
      chainId: chainId ?? null,
      connecting,
      isSwitching: isSwitchPending,
      error: null,
      isCorrectNetwork,
      connect: connectWallet,
      disconnect,
      switchToSepolia,
    }),
    [
      address,
      signer,
      provider,
      chainId,
      connecting,
      isSwitchPending,
      isCorrectNetwork,
      connectWallet,
      disconnect,
      switchToSepolia,
    ]
  )

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}

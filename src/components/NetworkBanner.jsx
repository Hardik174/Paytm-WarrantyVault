import { AlertTriangle, Loader2 } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

export default function NetworkBanner() {
  const { address, isCorrectNetwork, switchToSepolia, isSwitching } = useWallet()

  if (!address || isCorrectNetwork) return null

  return (
    <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Switch to Sepolia Testnet
      </div>
      <button
        onClick={switchToSepolia}
        disabled={isSwitching}
        className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {isSwitching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Switch Network
      </button>
    </div>
  )
}

import { Shield } from 'lucide-react'
import PortalToggle from './PortalToggle'
import WalletConnect from './WalletConnect'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warranty shadow-lg shadow-paytm-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              PaytmWarranty Protocol
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Blockchain-backed Proof of Ownership
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <PortalToggle />
          <WalletConnect />
        </div>
      </div>
    </header>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, ExternalLink, AlertTriangle, ArrowRightLeft,
  CheckCircle, X, Loader2,
} from 'lucide-react'
import { useWallet } from '../../context/WalletContext'
import { claimWarranty, safeTransferWarranty, getEtherscanTokenUrl } from '../../lib/contract'

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  EXPIRED: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  CLAIMED: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
}

export default function WarrantyCard({ warranty, onRefresh }) {
  const { signer, address } = useWallet()
  const [claiming, setClaiming] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [showClaimConfirm, setShowClaimConfirm] = useState(false)
  const [toast, setToast] = useState(null)

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await claimWarranty(signer, warranty.tokenId)
      setShowClaimConfirm(false)
      showToast('Warranty claim submitted successfully')
      onRefresh?.()
    } catch (err) {
      showToast(err.reason || err.message || 'Claim failed', 'error')
    } finally {
      setClaiming(false)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (!recipient) return
    setTransferring(true)
    try {
      await safeTransferWarranty(signer, address, recipient, warranty.tokenId)
      setShowTransfer(false)
      setRecipient('')
      showToast('Warranty ownership transferred — proof of ownership updated')
      onRefresh?.()
    } catch (err) {
      showToast(err.reason || err.message || 'Transfer failed', 'error')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="gradient-warranty p-6 text-white sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
                  Digital Warranty Credential
                </p>
                <p className="text-xs opacity-60">Proof of Ownership · Token #{warranty.tokenId}</p>
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[warranty.status]}`}>
              {warranty.status}
            </span>
          </div>

          <h3 className="mb-1 text-2xl font-bold">{warranty.productName}</h3>
          <p className="mb-6 text-sm opacity-80">
            {warranty.brand} · {warranty.modelNumber}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {[
              ['Serial Number', warranty.productSerial || 'N/A'],
              ['Vendor', warranty.vendorName || 'Authorized Vendor'],
              ['Purchase Date', warranty.purchaseDate.toLocaleDateString('en-IN')],
              ['Expiry Date', warranty.expiryDate.toLocaleDateString('en-IN')],
              ['Amount', formatAmount(warranty.purchaseAmount)],
              ['Paytm Txn', warranty.paytmTxnId],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="mb-0.5 text-xs opacity-60">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs opacity-70">
              <span>Warranty Coverage</span>
              <span>{Math.round(warranty.progress)}% elapsed</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${warranty.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  warranty.status === 'EXPIRED' ? 'bg-slate-400' : 'bg-white'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {warranty.status === 'ACTIVE' && (
              <>
                <button
                  onClick={() => setShowClaimConfirm(true)}
                  className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
                >
                  Claim Warranty
                </button>
                <button
                  onClick={() => setShowTransfer(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer on Resale
                </button>
              </>
            )}
            <a
              href={getEtherscanTokenUrl(warranty.tokenId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4" />
              Etherscan
            </a>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showClaimConfirm && (
          <Modal onClose={() => setShowClaimConfirm(false)}>
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h3 className="mb-2 text-lg font-bold text-slate-900">Claim Warranty?</h3>
              <p className="mb-6 text-sm text-slate-500">
                This will mark your warranty credential as claimed. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClaimConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Claim'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showTransfer && (
          <Modal onClose={() => setShowTransfer(false)}>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Transfer on Resale</h3>
            <p className="mb-4 text-sm text-slate-500">
              Transfer warranty ownership to the new buyer using ERC-721 safeTransferFrom.
              This updates the blockchain proof of ownership.
            </p>
            <form onSubmit={handleTransfer}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                required
                className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-paytm-500 focus:outline-none focus:ring-2 focus:ring-paytm-500/20"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransfer(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-warranty py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {transferring ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Transfer Ownership'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </motion.div>
    </div>
  )
}

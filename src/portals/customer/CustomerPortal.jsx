import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2, PackageOpen } from 'lucide-react'
import { useWallet } from '../../context/WalletContext'
import WalletConnect from '../../components/WalletConnect'
import { getCustomerWarranties } from '../../lib/contract'
import WarrantyCard from './WarrantyCard'

export default function CustomerPortal() {
  const { address, provider } = useWallet()
  const [warranties, setWarranties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWarranties = useCallback(async () => {
    if (!provider || !address) return
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomerWarranties(provider, address)
      setWarranties(data)
    } catch (err) {
      setError(err.message || 'Failed to load warranties')
      setWarranties([])
    } finally {
      setLoading(false)
    }
  }, [provider, address])

  useEffect(() => {
    fetchWarranties()
  }, [fetchWarranties])

  if (!address) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-warranty-subtle"
        >
          <Shield className="h-10 w-10 text-paytm-600" />
        </motion.div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Your Digital Warranties</h2>
        <p className="mb-8 text-slate-500">
          Connect your wallet via RainbowKit to view your blockchain-backed warranty credentials and proof of ownership.
        </p>
        <div className="flex justify-center">
          <WalletConnect />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-paytm-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Warranty Credentials</h2>
            <p className="text-sm text-slate-500">
              Blockchain-backed proof of ownership · {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-paytm-600" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && warranties.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <PackageOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-700">No warranties found</h3>
          <p className="max-w-sm text-sm text-slate-500">
            Purchase from a PaytmWarranty registered vendor to receive your Digital Warranty Credential automatically.
          </p>
        </motion.div>
      )}

      {!loading && warranties.length > 0 && (
        <div className="space-y-6">
          {warranties.map((warranty) => (
            <WarrantyCard
              key={warranty.tokenId}
              warranty={warranty}
              onRefresh={fetchWarranties}
            />
          ))}
        </div>
      )}
    </div>
  )
}

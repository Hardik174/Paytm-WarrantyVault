import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Store, IndianRupee, Clock, User, AlertTriangle, Loader2, Rocket } from 'lucide-react'
import { getPayments, VENDOR_INFO } from '../../lib/mockData'
import { useWallet } from '../../context/WalletContext'
import { isRegisteredVendor, validateContract } from '../../lib/contract'
import { deployPaytmWarranty } from '../../lib/deploy'
import RegisterFlow from './RegisterFlow'

export default function VendorDashboard({ demoTrigger }) {
  const { address, provider, signer } = useWallet()
  const [payments, setPayments] = useState(getPayments())
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [demoState, setDemoState] = useState(null)
  const [contractError, setContractError] = useState(null)
  const [vendorError, setVendorError] = useState(null)
  const [deploying, setDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(null)

  const checkContract = useCallback(async () => {
    if (!provider) return
    const validation = await validateContract(provider)
    if (!validation.valid) {
      setContractError(validation.error)
      setVendorError(null)
      return
    }
    setContractError(null)
    setDeploySuccess(null)

    if (address) {
      const vendor = await isRegisteredVendor(provider, address)
      if (!vendor.registered) {
        setVendorError('Connected wallet is not a registered vendor. Use the wallet that deployed the contract.')
      } else {
        setVendorError(null)
      }
    }
  }, [provider, address])

  useEffect(() => {
    checkContract()
    window.addEventListener('paytm-contract-updated', checkContract)
    return () => window.removeEventListener('paytm-contract-updated', checkContract)
  }, [checkContract])

  useEffect(() => {
    if (window.__PAYTM_DEMO_AUTO_FILL) {
      const demo = window.__PAYTM_DEMO_AUTO_FILL
      setSelectedPayment(demo.payment)
      setDemoState(demo)
      delete window.__PAYTM_DEMO_AUTO_FILL
    }
  }, [demoTrigger])

  const handleDeploy = async () => {
    if (!signer) {
      setContractError('Connect your wallet first, then deploy.')
      return
    }
    setDeploying(true)
    setContractError(null)
    try {
      const deployed = await deployPaytmWarranty(signer)
      setDeploySuccess(`PaytmWarranty deployed at ${deployed.slice(0, 10)}...`)
      await checkContract()
    } catch (err) {
      setContractError(err.reason || err.message || 'Deployment failed')
    } finally {
      setDeploying(false)
    }
  }

  const handleComplete = (txnId) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.txnId === txnId ? { ...p, status: 'registered' } : p
      )
    )
  }

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {(contractError || vendorError) && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1 space-y-3">
              <p>{contractError || vendorError}</p>
              {contractError && (
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="inline-flex items-center gap-2 rounded-lg bg-paytm-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-paytm-700 disabled:opacity-60"
                >
                  {deploying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {deploying ? 'Deploying to Sepolia...' : 'Deploy PaytmWarranty Contract'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deploySuccess && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800">
          {deploySuccess} — you are registered as vendor. Mint away!
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
      >
        <Store className="h-5 w-5 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-900">
            ✅ {VENDOR_INFO.name} | {VENDOR_INFO.badge}
          </p>
          <p className="text-sm text-emerald-700">
            Authorized to issue Digital Warranty Credentials at point of sale
          </p>
        </div>
      </motion.div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Recent Paytm Payments</h2>
        <p className="text-sm text-slate-500">
          Select a transaction to register blockchain-backed proof of ownership
        </p>
      </div>

      <div className="space-y-3">
        {payments.map((payment, i) => (
          <motion.div
            key={payment.txnId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paytm-100">
                <User className="h-5 w-5 text-paytm-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{payment.customerName}</p>
                <p className="text-sm text-slate-500">{payment.txnId}</p>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {formatAmount(payment.amount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {payment.time}
                  </span>
                </div>
              </div>
            </div>

            {payment.status === 'pending_warranty' ? (
              <button
                onClick={() => setSelectedPayment(payment)}
                className="animate-pulse-slow shrink-0 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition hover:bg-orange-600"
              >
                Register Warranty
              </button>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                ✅ Warranty Active
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {selectedPayment && (
        <RegisterFlow
          payment={selectedPayment}
          initialDemo={demoState}
          onClose={() => { setSelectedPayment(null); setDemoState(null) }}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}

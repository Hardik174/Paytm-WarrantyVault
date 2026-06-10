import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, ExternalLink, Shield } from 'lucide-react'
import { useWallet } from '../../../context/WalletContext'
import { mintWarranty, getEtherscanTxUrl } from '../../../lib/contract'
import { VENDOR_INFO } from '../../../lib/mockData'

export default function MintStep({ payment, formData, onSuccess, onRegisterAnother }) {
  const { signer, address, isCorrectNetwork } = useWallet()
  const [minting, setMinting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + Number(formData.warrantyMonths))

  const handleMint = async () => {
    if (!signer) {
      setError('Please connect your wallet first')
      return
    }
    if (!isCorrectNetwork) {
      setError('Please switch to Sepolia Testnet')
      return
    }

    setMinting(true)
    setError(null)
    try {
      const res = await mintWarranty(signer, {
        paytmTxnId: payment.txnId,
        productName: formData.productName,
        productSerial: formData.serialNumber || 'N/A',
        brand: formData.brand,
        modelNumber: formData.modelNumber,
        customerAddress: formData.customerWallet,
        purchaseAmount: formData.purchaseAmount,
        warrantyMonths: formData.warrantyMonths,
      })
      setResult(res)
      onSuccess?.(payment.txnId)
    } catch (err) {
      setError(err.message || err.reason || 'Failed to mint warranty credential')
    } finally {
      setMinting(false)
    }
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </motion.div>

        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          Warranty Registered Successfully 🎉
        </h2>
        <p className="mb-6 text-slate-500">
          Digital Warranty Credential minted to customer wallet on Sepolia
        </p>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Token ID</p>
          <p className="text-2xl font-bold text-paytm-700">#{result.tokenId || '—'}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={getEtherscanTxUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            View on Etherscan
          </a>
          <button
            onClick={() => window.location.href = '/customer'}
            className="inline-flex items-center gap-2 rounded-xl bg-paytm-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-paytm-700"
          >
            View Customer Warranty
          </button>
          <button
            onClick={onRegisterAnother}
            className="inline-flex items-center gap-2 rounded-xl border border-paytm-200 bg-paytm-50 px-5 py-2.5 text-sm font-semibold text-paytm-700 transition hover:bg-paytm-100"
          >
            Register Another
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-md">
        <CertificatePreview
          formData={formData}
          payment={payment}
          expiryDate={expiryDate}
        />
      </div>

      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Transaction Summary
        </h3>
        <dl className="space-y-3 text-sm">
          {[
            ['Product', formData.productName],
            ['Customer', payment.customerName],
            ['Wallet', `${formData.customerWallet?.slice(0, 10)}...`],
            ['Amount', formatAmount(formData.purchaseAmount)],
            ['Warranty', `${formData.warrantyMonths} months`],
            ['Network', 'Sepolia Testnet'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMint}
          disabled={minting}
          className="inline-flex items-center gap-2 rounded-xl gradient-warranty px-8 py-4 text-base font-semibold text-white shadow-lg shadow-paytm-500/30 disabled:opacity-60"
        >
          {minting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Recording warranty on Sepolia...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5" />
              Confirm &amp; Mint Warranty Credential
            </>
          )}
        </motion.button>
        {!address && (
          <p className="mt-3 text-sm text-amber-600">Connect wallet to mint</p>
        )}
      </div>
    </div>
  )
}

function CertificatePreview({ formData, payment, expiryDate }) {
  return (
    <motion.div
      initial={{ rotateY: -8, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      className="overflow-hidden rounded-2xl shadow-2xl"
      style={{ perspective: '1000px' }}
    >
      <div className="gradient-warranty p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-wide opacity-90">
              DIGITAL WARRANTY CREDENTIAL
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">PREVIEW</span>
        </div>

        <h3 className="mb-1 text-xl font-bold">{formData.productName}</h3>
        <p className="mb-4 text-sm opacity-80">{formData.brand} · {formData.modelNumber}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="opacity-60">Serial</p>
            <p className="font-medium">{formData.serialNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="opacity-60">Vendor</p>
            <p className="font-medium">{VENDOR_INFO.name}</p>
          </div>
          <div>
            <p className="opacity-60">Customer</p>
            <p className="font-medium">{payment.customerName}</p>
          </div>
          <div>
            <p className="opacity-60">Valid Until</p>
            <p className="font-medium">{expiryDate.toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/20 pt-4">
          <p className="text-xs opacity-60">Paytm Txn · Proof of Ownership</p>
          <p className="font-mono text-sm">{payment.txnId}</p>
        </div>
      </div>
    </motion.div>
  )
}

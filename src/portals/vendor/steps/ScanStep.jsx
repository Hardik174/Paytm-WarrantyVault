import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileImage, Loader2, AlertCircle } from 'lucide-react'
import { extractInvoiceDetails } from '../../../lib/sarvam'

export default function ScanStep({ payment, onComplete, onSkip }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f)
    setError(null)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
        handleFile(f)
      }
    },
    [handleFile]
  )

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const details = await extractInvoiceDetails(file)
      onComplete({ details, preview, file })
    } catch (err) {
      setError(err.message || 'Sarvam Vision extraction failed. Try again or fill manually.')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-paytm-200 bg-paytm-50/50 px-4 py-3 text-sm text-paytm-800">
        Registering warranty for <strong>{payment.customerName}</strong> | Txn:{' '}
        <strong>{payment.txnId}</strong> | {formatAmount(payment.amount)}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
          dragOver
            ? 'border-paytm-500 bg-paytm-50'
            : 'border-slate-300 bg-white hover:border-paytm-400 hover:bg-slate-50'
        }`}
        onClick={() => document.getElementById('invoice-upload').click()}
      >
        <input
          id="invoice-upload"
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          <img src={preview} alt="Invoice preview" className="max-h-64 rounded-lg object-contain p-4" />
        ) : file?.type === 'application/pdf' ? (
          <div className="flex flex-col items-center gap-2 p-8 text-slate-500">
            <FileImage className="h-12 w-12 text-paytm-500" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm">PDF uploaded — ready for extraction</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-paytm-100">
              <Upload className="h-8 w-8 text-paytm-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700">Drop invoice or box label here</p>
            <p className="text-sm text-slate-500">Supports images and PDF files</p>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleExtract}
          disabled={!file || loading}
          className="flex w-full max-w-md items-center justify-center gap-2 rounded-xl gradient-warranty px-6 py-4 text-base font-semibold text-white shadow-lg shadow-paytm-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sarvam Vision is reading your invoice...
            </>
          ) : (
            <>
              <SparklesIcon />
              Extract with Sarvam Vision AI
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="text-sm text-slate-500 underline-offset-2 transition hover:text-paytm-600 hover:underline"
        >
          Skip scan, fill manually →
        </button>
      </div>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
    </svg>
  )
}

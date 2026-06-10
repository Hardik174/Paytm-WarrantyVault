import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

const WARRANTY_OPTIONS = [12, 24, 36]

export default function VerifyStep({ payment, scanData, aiExtracted, onConfirm, onBack }) {
  const [form, setForm] = useState({
    productName: scanData?.product_name || '',
    brand: scanData?.brand || '',
    modelNumber: scanData?.model_number || '',
    serialNumber: scanData?.serial_number || '',
    purchaseAmount: scanData?.purchase_amount || String(payment.amount),
    customerWallet: payment.customerWallet || '',
    warrantyMonths: scanData?.warranty_months || 12,
  })

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const aiFields = aiExtracted
    ? ['productName', 'brand', 'modelNumber', 'serialNumber', 'purchaseAmount']
    : []

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Invoice Preview
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {scanData?.preview ? (
              <img
                src={scanData.preview}
                alt="Invoice"
                className="h-full max-h-96 w-full object-contain p-4"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                No invoice image — manual entry mode
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Warranty Details
          </h3>

          {[
            { key: 'productName', label: 'Product Name' },
            { key: 'brand', label: 'Brand' },
            { key: 'modelNumber', label: 'Model Number' },
            { key: 'serialNumber', label: 'Serial Number' },
            { key: 'purchaseAmount', label: 'Purchase Amount (INR)' },
            { key: 'customerWallet', label: 'Customer Wallet Address' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                {label}
                {aiFields.includes(key) && form[key] && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    <Sparkles className="h-3 w-3" />
                    AI extracted
                  </span>
                )}
              </label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                required={key !== 'serialNumber'}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition focus:border-paytm-500 focus:outline-none focus:ring-2 focus:ring-paytm-500/20"
              />
            </div>
          ))}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Warranty Period</label>
            <div className="flex gap-2">
              {WARRANTY_OPTIONS.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => update('warrantyMonths', months)}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                    form.warrantyMonths === months
                      ? 'border-paytm-500 bg-paytm-50 text-paytm-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {months} months
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          ← Back to scan
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="flex items-center gap-2 rounded-xl gradient-warranty px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-paytm-500/30"
        >
          Confirm &amp; Mint Warranty
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </form>
  )
}

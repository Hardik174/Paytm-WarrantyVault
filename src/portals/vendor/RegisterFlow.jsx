import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import ScanStep from './steps/ScanStep'
import VerifyStep from './steps/VerifyStep'
import MintStep from './steps/MintStep'

const STEPS = ['Scan Invoice', 'Verify Details', 'Mint on Blockchain']

export default function RegisterFlow({ payment, onClose, onComplete, initialDemo }) {
  const [step, setStep] = useState(initialDemo?.skipToStep ?? 0)
  const [scanData, setScanData] = useState(initialDemo?.scanData ?? null)
  const [aiExtracted, setAiExtracted] = useState(initialDemo?.aiExtracted ?? false)
  const [formData, setFormData] = useState(null)

  const handleScanComplete = ({ details, preview, file }) => {
    setScanData({ ...details, preview, file })
    setAiExtracted(true)
    setStep(1)
  }

  const handleSkip = () => {
    setScanData({ preview: null })
    setAiExtracted(false)
    setStep(1)
  }

  const handleVerify = (form) => {
    setFormData(form)
    setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Register Digital Warranty</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    i < step
                      ? 'bg-emerald-500 text-white'
                      : i === step
                        ? 'gradient-warranty text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    i <= step ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded ${
                      i < step ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <ScanStep
                  payment={payment}
                  onComplete={handleScanComplete}
                  onSkip={handleSkip}
                />
              )}
              {step === 1 && (
                <VerifyStep
                  payment={payment}
                  scanData={scanData}
                  aiExtracted={aiExtracted}
                  onConfirm={handleVerify}
                  onBack={() => setStep(0)}
                />
              )}
              {step === 2 && formData && (
                <MintStep
                  payment={payment}
                  formData={formData}
                  onSuccess={(txnId) => onComplete(txnId)}
                  onRegisterAnother={onClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

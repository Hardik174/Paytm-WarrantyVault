import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, ChevronUp, RotateCcw, User } from 'lucide-react'

export default function DemoHelper({ onAutoFill, onReset }) {
  const [expanded, setExpanded] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72">
      <motion.div
        layout
        className="glass overflow-hidden rounded-2xl shadow-2xl"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Demo Helper</span>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 px-3 pb-3"
            >
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={onAutoFill}
                  className="flex items-center gap-2 rounded-lg bg-paytm-600/80 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-paytm-600"
                >
                  <Sparkles className="h-4 w-4" />
                  Auto-fill demo data (skip Sarvam)
                </button>
                <button
                  onClick={() => navigate('/customer')}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/20"
                >
                  <User className="h-4 w-4" />
                  Switch to Customer View
                </button>
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset demo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

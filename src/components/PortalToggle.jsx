import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function PortalToggle() {
  const location = useLocation()
  const navigate = useNavigate()
  const isVendor = location.pathname.startsWith('/vendor')

  return (
    <div className="flex items-center rounded-xl bg-slate-100 p-1">
      {['Vendor View', 'Customer View'].map((label) => {
        const vendor = label === 'Vendor View'
        const active = vendor ? isVendor : !isVendor
        return (
          <button
            key={label}
            onClick={() => navigate(vendor ? '/vendor' : '/customer')}
            className="relative px-4 py-2 text-sm font-medium transition-colors"
          >
            {active && (
              <motion.div
                layoutId="portal-toggle"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${active ? 'text-paytm-700' : 'text-slate-500'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

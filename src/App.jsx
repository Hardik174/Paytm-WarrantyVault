import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Web3Provider from './providers/Web3Provider'
import Header from './components/Header'
import NetworkBanner from './components/NetworkBanner'
import DemoHelper from './components/DemoHelper'
import VendorDashboard from './portals/vendor/VendorDashboard'
import CustomerPortal from './portals/customer/CustomerPortal'
import { getPayments } from './lib/mockData'
import { DEMO_DATA } from './lib/sarvam'

export default function App() {
  const [demoTrigger, setDemoTrigger] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  const handleAutoFill = useCallback(() => {
    setDemoTrigger((n) => n + 1)
    window.__PAYTM_DEMO_AUTO_FILL = {
      payment: getPayments()[0],
      scanData: { ...DEMO_DATA, preview: null },
      aiExtracted: true,
      skipToStep: 1,
    }
    window.location.href = '/vendor'
  }, [])

  const handleReset = useCallback(() => {
    setResetKey((n) => n + 1)
    delete window.__PAYTM_DEMO_AUTO_FILL
    const deployed = localStorage.getItem('paytm_contract_address')
    localStorage.clear()
    if (deployed) localStorage.setItem('paytm_contract_address', deployed)
    window.location.href = '/vendor'
  }, [])

  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <NetworkBanner />
          <Header />
          <main key={resetKey}>
            <Routes>
              <Route path="/vendor" element={<VendorDashboard demoTrigger={demoTrigger} />} />
              <Route path="/customer" element={<CustomerPortal />} />
              <Route path="*" element={<Navigate to="/vendor" replace />} />
            </Routes>
          </main>
          <DemoHelper onAutoFill={handleAutoFill} onReset={handleReset} />
        </div>
      </BrowserRouter>
    </Web3Provider>
  )
}

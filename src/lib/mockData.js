export const VENDOR_INFO = {
  name: 'Croma Electronics, Andheri West',
  badge: 'Registered Vendor',
}

export const getPayments = () => [
  {
    txnId: 'PTM2026060601',
    customerName: 'Rahul Mehta',
    customerWallet: import.meta.env.VITE_DEMO_CUSTOMER_ADDRESS,
    amount: 79999,
    time: '10:23 AM',
    status: 'pending_warranty',
  },
  {
    txnId: 'PTM2026060602',
    customerName: 'Priya Shah',
    customerWallet: '0x0000000000000000000000000000000000000001',
    amount: 29999,
    time: '11:45 AM',
    status: 'pending_warranty',
  },
  {
    txnId: 'PTM2026060603',
    customerName: 'Amit Verma',
    customerWallet: '0x0000000000000000000000000000000000000002',
    amount: 134999,
    time: '12:10 PM',
    status: 'registered',
  },
]

export const WARRANTY_STATUS = {
  0: 'ACTIVE',
  1: 'EXPIRED',
  2: 'CLAIMED',
}

export const SEPOLIA_CHAIN_ID = 11155111
export const SEPOLIA_CHAIN_HEX = '0xaa36a7'

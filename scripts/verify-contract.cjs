require('dotenv').config()
const { ethers } = require('ethers')

const CONTRACT = process.argv[2] || process.env.VITE_CONTRACT_ADDRESS
const RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'

const MINT_SELECTOR = ethers.id(
  'mintWarranty((string,string,string,string,string,address,uint256,uint256))'
).slice(0, 10)

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC)
  const code = await provider.getCode(CONTRACT)

  if (code === '0x') {
    console.error('No contract at', CONTRACT)
    process.exit(1)
  }

  const hasMint = code.toLowerCase().includes(MINT_SELECTOR.slice(2).toLowerCase())
  console.log('Contract:', CONTRACT)
  console.log('Bytecode size:', (code.length - 2) / 2, 'bytes')
  console.log('mintWarranty selector', MINT_SELECTOR, hasMint ? 'FOUND' : 'NOT FOUND')

  if (!hasMint) {
    console.error('')
    console.error('This address does NOT implement PaytmWarranty.mintWarranty().')
    console.error('Deploy the correct contract: npm run deploy:sepolia')
    process.exit(1)
  }

  console.log('Contract looks compatible.')
}

main().catch(console.error)

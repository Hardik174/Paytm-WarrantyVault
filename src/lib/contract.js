import { BrowserProvider, Contract, formatUnits } from 'ethers'
import { WARRANTY_ABI } from './abi'
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_HEX, WARRANTY_STATUS } from './mockData'

const STORAGE_KEY = 'paytm_contract_address'
const MINT_SELECTOR = '0x63f94e7b'

export function getContractAddress() {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_CONTRACT_ADDRESS
}

export function setContractAddress(address) {
  localStorage.setItem(STORAGE_KEY, address)
  window.dispatchEvent(new Event('paytm-contract-updated'))
}

export function clearContractAddress() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('paytm-contract-updated'))
}

function getContract(signerOrProvider) {
  return new Contract(getContractAddress(), WARRANTY_ABI, signerOrProvider)
}

export async function validateContract(provider) {
  const address = getContractAddress()
  const code = await provider.getCode(address)
  if (!code || code === '0x') {
    return {
      valid: false,
      error: `No contract at ${address}. Click "Deploy PaytmWarranty" below (one-time, ~30 sec).`,
      address,
    }
  }

  if (!code.toLowerCase().includes(MINT_SELECTOR.slice(2))) {
    return {
      valid: false,
      error:
        'Wrong contract at this address — it does not support mintWarranty(). Deploy PaytmWarranty using the button below.',
      address,
    }
  }

  return { valid: true, error: null, address }
}

function parseContractError(err) {
  const msg = err?.shortMessage || err?.reason || err?.message || 'Transaction failed'

  if (msg.includes('missing revert data') || msg.includes('CALL_EXCEPTION')) {
    return (
      'Contract call reverted. The address in VITE_CONTRACT_ADDRESS likely does not implement PaytmWarranty. ' +
      'Deploy with "npm run deploy:sepolia", update .env, and connect the deployer wallet as vendor.'
    )
  }
  if (msg.includes('Not a registered vendor')) {
    return 'Your connected wallet is not a registered vendor. Connect the wallet that deployed the contract, or call registerVendor() from the owner wallet.'
  }
  if (msg.includes('Txn ID already used')) {
    return 'This Paytm transaction ID was already used. Pick a different txn or reset the demo.'
  }
  if (msg.includes('user rejected')) {
    return 'Transaction rejected in wallet.'
  }

  return msg
}

export async function checkNetwork() {
  if (!window.ethereum) return { correct: false, chainId: null }
  const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16)
  return { correct: chainId === SEPOLIA_CHAIN_ID, chainId }
}

export async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    })
    return true
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_CHAIN_HEX,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      })
      return true
    }
    throw error
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  const { correct } = await checkNetwork()
  if (!correct) {
    await switchToSepolia()
  }

  const provider = new BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  const network = await provider.getNetwork()

  return { provider, signer, address, chainId: Number(network.chainId) }
}

function formatWarrantyData(tokenId, data) {
  const purchaseDate = new Date(Number(data.purchaseDate) * 1000)
  const expiryDate = new Date(Number(data.expiryDate) * 1000)
  const now = new Date()
  const totalMs = expiryDate - purchaseDate
  const elapsedMs = now - purchaseDate
  const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))

  let status = WARRANTY_STATUS[data.status] || 'ACTIVE'
  if (status === 'ACTIVE' && now > expiryDate) {
    status = 'EXPIRED'
  }

  return {
    tokenId: tokenId.toString(),
    paytmTxnId: data.paytmTxnId,
    productName: data.productName,
    productSerial: data.productSerial,
    brand: data.brand,
    modelNumber: data.modelNumber,
    customerAddress: data.customerAddress,
    purchaseAmount: formatUnits(data.purchaseAmount, 2),
    warrantyMonths: Number(data.warrantyMonths),
    purchaseDate,
    expiryDate,
    status,
    vendorName: data.vendorName,
    progress,
  }
}

export async function mintWarranty(signer, input) {
  const provider = signer.provider
  const validation = await validateContract(provider)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const contract = getContract(signer)
  const mintInput = {
    paytmTxnId: input.paytmTxnId,
    productName: input.productName,
    productSerial: input.productSerial || 'N/A',
    brand: input.brand,
    modelNumber: input.modelNumber,
    customerAddress: input.customerAddress,
    purchaseAmount: BigInt(Math.round(Number(input.purchaseAmount) * 100)),
    warrantyMonths: BigInt(input.warrantyMonths),
  }

  try {
    await contract.mintWarranty.staticCall(mintInput)
  } catch (err) {
    throw new Error(parseContractError(err))
  }

  const tx = await contract.mintWarranty(mintInput)
  const receipt = await tx.wait()

  let tokenId = null
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log)
      if (parsed?.name === 'WarrantyMinted') {
        tokenId = parsed.args.tokenId.toString()
        break
      }
    } catch {
      // not our event
    }
  }

  if (!tokenId) {
    const balance = await contract.balanceOf(input.customerAddress)
    if (balance > 0n) {
      tokenId = (await contract.tokenOfOwnerByIndex(input.customerAddress, balance - 1n)).toString()
    }
  }

  return { txHash: receipt.hash, tokenId }
}

export async function getWarranty(provider, tokenId) {
  const contract = getContract(provider)
  const data = await contract.getWarranty(tokenId)
  return formatWarrantyData(tokenId, data)
}

export async function getCustomerWarranties(provider, customerAddress) {
  const contract = getContract(provider)
  const balance = await contract.balanceOf(customerAddress)
  const warranties = []

  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(customerAddress, i)
    const warranty = await getWarranty(provider, tokenId)
    warranties.push(warranty)
  }

  return warranties
}

export async function claimWarranty(signer, tokenId) {
  const contract = getContract(signer)
  const tx = await contract.claimWarranty(tokenId)
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

export async function safeTransferWarranty(signer, currentAddress, newAddress, tokenId) {
  const contract = getContract(signer)
  const tx = await contract.safeTransferFrom(currentAddress, newAddress, tokenId)
  const receipt = await tx.wait()
  return { txHash: receipt.hash }
}

export function getEtherscanTxUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`
}

export function getEtherscanTokenUrl(tokenId) {
  return `https://sepolia.etherscan.io/nft/${getContractAddress()}/${tokenId}`
}

export async function isRegisteredVendor(provider, address) {
  try {
    const validation = await validateContract(provider)
    if (!validation.valid) return { registered: false, name: null, error: validation.error }
    const contract = getContract(provider)
    const vendor = await contract.vendors(address)
    return { registered: vendor.registered, name: vendor.name, error: null }
  } catch {
    return { registered: false, name: null, error: null }
  }
}

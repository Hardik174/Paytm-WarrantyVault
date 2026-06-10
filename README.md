# 💎 Paytm WarrantyVault

> **Winner/Submission for PayTM AI Hackathon** — An end-to-end decentralized application (dApp) bridging Web2 retail payments with Web3 blockchain-backed ownership, powered by state-of-the-art Document AI.

---

## 📖 Project Overview

Today, warranties and invoices are fragmented across paper receipts, emails, and brand portals. Customers lose proofs of purchase, warranty claims become painful, and ownership transfer during resale is messy.

**Paytm WarrantyVault** addresses this by transforming traditional, easily-lost paper receipts and invoices into secure, verifiable, and transferable **ERC-721 NFT Warranty Credentials** on the Ethereum network (Sepolia Testnet). It turns transaction data into a trusted proof-of-ownership infrastructure, improving customer trust and post-purchase experience.

With Paytm WarrantyVault:
1. **Vendors** can activate and mint digital warranties in one click after a Paytm transaction.
2. **Sarvam AI** automatically extracts invoice and product details using OCR and structures them via LLMs.
3. **Warranties** are tokenized on-chain as NFTs.
4. **Customers** can seamlessly claim, resell, or transfer their warranties.

---

## 🚀 Key Features

### 🏪 1. Vendor / Point-of-Sale Portal
- **Transaction Dashboard:** Retrieves recent customer payments completed via Paytm Payment Gateway.
- **AI Document Digitization:** Vendors drop in/upload a purchase invoice or product box label.
- **Sarvam AI Integration:** 
  - **OCR Digitization:** Uses the Sarvam Document Digitization API to transcribe images or PDFs.
  - **Structured LLM Parsing:** Uses the `sarvam-30b` model to parse messy text into structured JSON metadata (`product_name`, `brand`, `model_number`, `serial_number`, `purchase_amount`, `warranty_months`).
- **On-Chain Minting:** Issues the ERC-721 NFT warranty directly to the customer's wallet address with a single click.

### 👤 2. Customer Portal
- **Wallet-Connected Dashboard:** Customers connect their Ethereum wallet (using **RainbowKit**) to view their active warranty NFTs.
- **Dynamic Status Bar:** Computes and displays the active lifespan of each warranty in real-time.
- **On-Chain Claims:** Allows customers to mark warranties as "Claimed" directly on-chain when service is requested.
- **Transferable Ownership:** Supports transferring/selling product ownership and the associated warranty to a new wallet address (ideal for secondary markets and product reselling).

### 🛠️ 3. Developer & Demo Helpers
- **Simulated Sandbox Mode:** Includes a floating dashboard on the bottom-right that lets you auto-fill mock transaction data and skip directly to minting for verification.
- **Auto-Deployment Utility:** Allows deploying a new instance of the contract to Sepolia directly from the UI when a contract is missing.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Smart Contracts** | Solidity (v0.8.20), Hardhat | ERC-721 contract with Enumerable extension |
| **Frontend Framework** | React (v18), Vite, Tailwind CSS | High-performance SPA with premium styling |
| **Web3 & Wallet** | RainbowKit, Wagmi, Viem, Ethers.js | Unified wallet connector and blockchain client |
| **AI Layer** | Sarvam AI API | Document OCR Digitization & LLM structuring |
| **Animations** | Framer Motion | Smooth state transitions and micro-animations |

---

## 📁 Repository Structure

```
├── contracts/
│   └── PaytmWarranty.sol       # Solidity ERC-721 Smart Contract
├── scripts/
│   ├── deploy.cjs             # Hardhat deployment script for Sepolia
│   └── verify-contract.cjs    # Contract verification utility
├── src/
│   ├── components/            # Shared UI components (Header, Connect, banners)
│   ├── portals/
│   │   ├── customer/          # Customer Warranty Vault view & action modals
│   │   └── vendor/            # Vendor registration, OCR scan, and mint flow
│   ├── lib/
│   │   ├── contract.js        # Ethers.js contract interactions
│   │   ├── sarvam.js          # Sarvam AI OCR & Chat api requests
│   │   └── wagmi.js           # Wagmi client setup
│   ├── providers/             # Web3 provider wrapper (RainbowKit)
│   ├── App.jsx                # Router & main application shell
│   └── index.css              # Custom Tailwind styles and gradients
├── tailwind.config.js         # Custom branding colors (Paytm blue/light-blue)
├── vite.config.js             # Vite config & secure local API proxy
└── hardhat.config.cjs         # Hardhat environment configuration
```

---

## ⚙️ Setup & Installation

### Prerequisite
Ensure you have [Node.js](https://nodejs.org/) (v18+) and [Git](https://git-scm.com/) installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Hardik174/Paytm-WarrantyVault.git
cd Paytm-WarrantyVault
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Fill in your API Keys and configuration details:
```env
# Frontend API Keys
VITE_SARVAM_API_KEY=your_sarvam_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
VITE_CONTRACT_ADDRESS=your_deployed_contract_address_here

# Optional: Hardhat Sepolia Deployment Keys
PRIVATE_KEY=your_wallet_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

> 💡 **Get a Sarvam API Key:** Visit [Sarvam AI Developer Portal](https://dashboard.sarvam.ai/) to get your free API key.

---

## 📜 Smart Contract Deployment

If you want to compile and deploy your own copy of the `PaytmWarranty` smart contract to Sepolia testnet:

### 1. Compile the Contract
```bash
npm run compile
```

### 2. Deploy to Sepolia Testnet
```bash
npm run deploy:sepolia
```
Upon successful deployment, copy the contract address printed in the console and paste it into your `.env` under `VITE_CONTRACT_ADDRESS`.

---

## 💻 Running the Application

Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security & API Key Protection

To keep your Sarvam API Key secure and prevent exposing it to the client side, the project uses a **Vite proxy configure option** inside `vite.config.js`:
- All frontend calls go to `/api/sarvam/*`.
- The Vite development server catches these calls, proxies them to `https://api.sarvam.ai/*`, and injects the `api-subscription-key` header server-side.
- This ensures your API key never leaks in browser network request headers!

---

## 🤝 License

Distributed under the MIT License. See `LICENSE` for more information.

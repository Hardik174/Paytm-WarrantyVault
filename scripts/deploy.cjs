const hre = require('hardhat')

async function main() {
  const PaytmWarranty = await hre.ethers.getContractFactory('PaytmWarranty')
  const contract = await PaytmWarranty.deploy()
  await contract.waitForDeployment()
  const address = await contract.getAddress()

  console.log('PaytmWarranty deployed to:', address)
  console.log('')
  console.log('Update your .env:')
  console.log(`VITE_CONTRACT_ADDRESS=${address}`)
  console.log('')
  console.log('Deployer is auto-registered as vendor.')
  console.log('Connect the deployer wallet in Vendor View to mint warranties.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

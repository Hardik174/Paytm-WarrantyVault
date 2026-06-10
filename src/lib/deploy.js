import { ContractFactory } from 'ethers'
import artifact from '../../artifacts/contracts/PaytmWarranty.sol/PaytmWarranty.json'
import { setContractAddress } from './contract'

export async function deployPaytmWarranty(signer) {
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer)
  const contract = await factory.deploy()
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  setContractAddress(address)
  return address
}

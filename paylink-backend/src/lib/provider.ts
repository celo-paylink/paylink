import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";

const RPC = process.env.ALFAJORES_RPC || "https://alfajores-forno.celo-testnet.org";
export const provider = new ethers.JsonRpcProvider(RPC);

export function getPaylinkContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const p = signerOrProvider || provider;
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, p);
}

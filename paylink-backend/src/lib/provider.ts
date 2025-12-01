import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract";

const RPC = "https://forno.celo.org";
export const provider = new ethers.JsonRpcProvider(RPC);

export function getPaylinkContract() {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

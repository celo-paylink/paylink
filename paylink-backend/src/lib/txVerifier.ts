import { provider, getPaylinkContract } from "./provider";
import { ethers } from "ethers";

type ClaimCreatedPayload = {
  id: number;
  payer: string;
  token: string;
  amount: number | string;
  expiry: number;
  recipient: string | null;
  secretHash: string | null;
};

export async function verifyCreateTx(txHash: string, expectedClaimId?: number) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status === 0) throw new Error("tx failed or not found");

  const contract = getPaylinkContract();
  const contractAddress = await contract.getAddress();
  const iface = contract.interface;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "ClaimCreated") {
        const [id, payer, token, amount, expiry, recipient, secretHash] = parsed.args;
        const payload: ClaimCreatedPayload = {
          id: Number(id),
          payer: payer,
          token: token,
          amount: Number(amount).toString(),
          expiry: Number(expiry),
          recipient: recipient === ethers.ZeroAddress ? null : recipient,
          secretHash: (secretHash === ethers.ZeroHash ? null : secretHash)
        };
        if (expectedClaimId && payload.id !== expectedClaimId) {
          console.log("expected", expectedClaimId, "got", payload.id);
          throw new Error(`create event claimId mismatch. expected ${expectedClaimId} got ${payload.id}`);
        }
        return payload;
      }
    } catch (e) {
      console.warn("log parse error", e);
      // ignore parse errors for non-matching logs
    }
  }

  throw new Error("ClaimCreated event not found in tx");
}

export async function verifyClaimTx(txHash: string, expectedClaimId?: number) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status === 0) throw new Error("tx failed or not found");

  const contract = getPaylinkContract();
  const iface = contract.interface;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract.address.toString().toLowerCase()) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "Claimed") {
        const [id, claimer, amount] = parsed.args;
        const payload = {
          id: id.toNumber(),
          claimer: claimer,
          amount: amount.toString()
        };
        if (expectedClaimId && payload.id !== expectedClaimId) {
          throw new Error(`claim event claimId mismatch. expected ${expectedClaimId} got ${payload.id}`);
        }
        return payload;
      }
    } catch (e) {
      console.warn("log parse error", e);
    }
  }

  throw new Error("Claimed event not found in tx");
}

export async function verifyReclaimTx(txHash: string, expectedClaimId?: number) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status === 0) throw new Error("tx failed or not found");

  const contract = getPaylinkContract();
  const iface = contract.interface;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract.address.toString().toLowerCase()) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "Reclaimed") {
        const [id, payer, amount] = parsed.args;
        const payload = {
          id: id.toNumber(),
          payer: payer,
          amount: amount.toString()
        };
        if (expectedClaimId && payload.id !== expectedClaimId) {
          throw new Error(`reclaim event claimId mismatch. expected ${expectedClaimId} got ${payload.id}`);
        }
        return payload;
      }
    } catch (e) {
      console.warn("log parse error", e);
    }
  }

  throw new Error("Reclaimed event not found in tx");
}

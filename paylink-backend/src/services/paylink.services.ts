import * as queries from "../db/queries";
import { AppError } from "../error/errorHandler";
import { Status } from "../generated/prisma";
import { verifyClaimTx, verifyCreateTx, verifyReclaimTx } from "../lib/txVerifier";
import { generateClaimCode } from "../utils/claim-code";

export const createClaim = async (data: { 
  walletAddress: string,
  claimId: number,
  payerAddress: string,
  token: string,
  amount: number,
  expiry: Date,
  recipient: string,
  secretHash: string,
  txHashCreate: string
}, user: Express.User | undefined) => {
  const {
    claimId,
    payerAddress,
    token,
    amount,
    expiry,
    recipient,
    secretHash,
    txHashCreate
  } = data
  try {
    const event = await verifyCreateTx(txHashCreate, Number(claimId));
    if (event.payer.toLowerCase() !== data.payerAddress.toLowerCase()) {
      throw new AppError("payer address mismatch with on-chain event", 400);
    }
  } catch (err: Error | unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new AppError(`on-chain create tx verification failed: ${errorMessage}`, 400);
  }

  let claimCode = generateClaimCode(12);
  for (let i = 0; i < 5; i++) {
    const found = await queries.getClaimByCode(claimCode);
    if (!found) break;
    claimCode = generateClaimCode(12);
  }

  const created = await queries.createClaim({
    claimId: Number(claimId),
    claimCode,
    token,
    payerAddress: payerAddress,
    amount: String(amount),
    expiry: new Date(expiry),
    recipient: recipient || null,
    secretHash: secretHash || null,
    txHashCreate: txHashCreate,
    user: {connect: {id: user?.id}}
  });

  const link = `/claim/${claimCode}`;
  return { claim: created, link };
};

export const getClaim = async (claimCode: string ) => {
  const claim = await queries.getClaimByCode(claimCode);

  if (!claim) {
    throw new AppError("Claim not found", 404);
  }

  let recipientMasked = null;
  if (claim.recipient) {
    recipientMasked = `${claim.recipient.slice(0, 6)}...${claim.recipient.slice(-4)}`;
  }

  const claimData = {
    claimCode: claim.claimCode,
    claimId: claim.claimId,
    payerAddress: claim.payerAddress,
    token: claim.token,
    amount: claim.amount,
    expiry: claim.expiry,
    recipientMasked,
    requiresSecret: !!claim.secretHash,
    status: claim.status
  };

  return { claim: claimData };
};

export const confirmClaim = async (data: { 
  claimCode: string, 
  txHashClaim: string 
}) => {
  const { claimCode, txHashClaim } = data;

  const claim = await queries.getClaimByCode(claimCode);

  if (!claim) {
    throw new AppError("Claim not found", 404);
  }

  try {
    await verifyClaimTx(txHashClaim, Number(claim.claimId));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new AppError(`On-chain claim tx verification failed: ${errorMessage}`, 400);
  }

  // 3. Update claim in DB
  const updatedClaim = await queries.updateClaim(claim.id, {
    status: Status.CLAIMED,
    txHashClaim,
  });

  if (!updatedClaim) {
    throw new AppError("Failed to update claim after verification", 500);
  }

  // 4. Build response payload
  return {
    claimCode: updatedClaim.claimCode,
    status: updatedClaim.status,
    txHashClaim: updatedClaim.txHashClaim,
    claimedAt: updatedClaim.updatedAt,
  };
};

export const reclaimClaim = async (data: { 
  claimCode: string, 
  txHashReclaim: string 
}) => {
  const { claimCode, txHashReclaim } = data;

  const claim = await queries.getClaimByCode(claimCode);

  if (!claim) {
    throw new AppError("Claim not found", 404);
  }

  try {
    await verifyReclaimTx(txHashReclaim, Number(claim.claimId));
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new AppError(`On-chain claim tx verification failed: ${errorMessage}`, 400);
  }

  const updatedClaim = await queries.updateClaim(claim.id, {
    status: Status.RECLAIMED,
    txHashReclaim,
  });

  if (!updatedClaim) {
    throw new AppError("Failed to update claim after verification", 500);
  }

  return {
    claimCode: updatedClaim.claimCode,
    status: updatedClaim.status,
    txHashReclaim: updatedClaim.txHashReclaim,
    reclaimedAt: updatedClaim.updatedAt,
  };
};



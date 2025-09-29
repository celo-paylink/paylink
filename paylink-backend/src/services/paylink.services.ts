import * as queries from "../db/queries";
import { AppError } from "../error/errorHandler";
import { verifyCreateTx } from "../lib/txVerifier";
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
    const found = await queries.getClaimByCode(claimCode );
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


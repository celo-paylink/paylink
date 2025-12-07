import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from '@wagmi/core';
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { TOKEN_ADDRESSES } from "../libs/constants";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../libs/contract";
import { config } from "../libs/config";
import { useState, useMemo } from "react";

const claimSchema = z.object({
  secret: z.string().min(1, "Secret is required"),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export default function Claim() {
  const { claimCode } = useParams();
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Fetch claim data from smart contract using claim code
  const {
    data: claimData,
    isLoading,
    error,
    refetch
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getClaimByCode",
    args: [claimCode as string],
    query: {
      enabled: !!claimCode,
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
  });

  const { writeContractAsync: claimAsync } = useWriteContract();

  // Parse claim data - updated to match new contract return values
  const claim = useMemo(() => {
    if (!claimData) return null;

    const [
      id,
      payer,
      token,
      amount,
      expiry,
      claimed,
      statusEnum,
      recipientMasked,
      requiresSecret,
      isNative
    ] = claimData as [bigint, string, string, bigint, bigint, boolean, number, string, boolean, boolean];

    // Map enum to status string (0=CREATED, 1=CLAIMED, 2=RECLAIMED)
    let status: 'CREATED' | 'CLAIMED' | 'RECLAIMED' = 'CREATED';
    if (statusEnum === 1) {
      status = 'CLAIMED';
    } else if (statusEnum === 2) {
      status = 'RECLAIMED';
    }

    return {
      id,
      claimCode: claimCode || '',
      payerAddress: payer,
      token,
      amount: amount.toString(),
      expiry: Number(expiry) * 1000,
      status,
      claimed,
      recipientMasked: recipientMasked === ethers.ZeroAddress ? null : recipientMasked,
      requiresSecret,
      isNative,
    };
  }, [claimData, claimCode]);

  const handleClaimContract = async (secret?: string) => {
    if (!claim) {
      toast.error("Claim data not available");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet to claim");
      return;
    }

    if (claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase()) {
      toast.error("You are not authorized to claim this payment");
      return;
    }

    try {
      setIsProcessing(true);

      const secretBytes = secret
        ? ethers.hexlify(ethers.toUtf8Bytes(secret))
        : ethers.hexlify(ethers.toUtf8Bytes(""));

      toast.info("Submitting claim to blockchain...");

      const hash = await claimAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "claim",
        args: [claimCode as string, secretBytes as `0x${string}`],
      });

      toast.info("Waiting for confirmation...");

      const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

      if (receipt.status === 'success') {
        setClaimTxHash(hash);
        setClaimSuccess(true);
        toast.success("Claim successful! Funds have been transferred to your wallet.");

        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        toast.error("Transaction failed");
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      const message = error?.cause?.cause?.shortMessage ||
        error?.cause?.shortMessage ||
        error?.shortMessage ||
        error?.message ||
        'Unknown error occurred';
      toast.error(`Failed to claim: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = (formData: ClaimFormData) => {
    handleClaimContract(formData.secret);
  };

  const handleClaimWithoutSecret = () => {
    handleClaimContract();
  };

  const getTokenName = (tokenAddress: string) => {
    const normalizedAddress = tokenAddress.toLowerCase();

    if (tokenAddress === ethers.ZeroAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      return "CELO";
    }

    const tokenEntry = Object.entries(TOKEN_ADDRESSES).find(
      ([, address]) => address.toLowerCase() === normalizedAddress
    );

    return tokenEntry ? tokenEntry[0] : "Unknown Token";
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch {
      return "0";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="card">
          <p className="muted">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="card">
          <h2 style={{ color: "#ef4444" }}>Failed to load claim</h2>
          <p className="muted">
            {error ? "Invalid claim code or claim does not exist." : "No claim data available."}
          </p>
          <p className="muted" style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Please check the claim code and try again.
          </p>
        </div>
      </div>
    );
  }

  const tokenName = getTokenName(claim.token);
  const isExpired = new Date(claim.expiry) < new Date();
  const isClaimed = claim.status === "CLAIMED";
  const isReclaimed = claim.status === "RECLAIMED";

  return (
    <div className="container" style={{ paddingTop: "2rem", maxWidth: "48rem" }}>
      <div className="card">
        <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>
          Claim Payment
        </h1>
        <p className="muted">Review the details below and claim your payment</p>

        <div className="spacer-lg"></div>

        {!isConnected && !isClaimed && !isReclaimed && !isExpired && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(251, 191, 36, 0.15)",
            border: "1px solid #fbbf24",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#fbbf24", fontWeight: 600 }}>
              ⚠️ Please connect your wallet to claim this payment
            </p>
          </div>
        )}

        {isClaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(34, 199, 108, 0.15)",
            border: "1px solid var(--primary)",
            borderRadius: "8px"
          }}>
            <p style={{ color: "var(--primary)", fontWeight: 600 }}>
              ✓ This claim has already been claimed by a recipient
            </p>
          </div>
        )}

        {isReclaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid #3b82f6",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#3b82f6", fontWeight: 600 }}>
              ℹ️ This claim has been reclaimed by the payer after expiry
            </p>
          </div>
        )}

        {isExpired && !isClaimed && !isReclaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#ef4444", fontWeight: 600 }}>
              ⚠️ This claim has expired and can only be reclaimed by the payer
            </p>
          </div>
        )}

        {claim.recipientMasked && isConnected && address?.toLowerCase() !== claim.recipientMasked.toLowerCase() && !isClaimed && !isReclaimed && !isExpired && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#ef4444", fontWeight: 600 }}>
              ⚠️ This claim is restricted to a specific recipient address
            </p>
            <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Your connected wallet is not authorized to claim this payment.
            </p>
          </div>
        )}

        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
              Claim Code
            </label>
            <p style={{ fontFamily: "monospace", fontSize: "1.125rem", fontWeight: 600 }}>
              {claim.claimCode}
            </p>
          </div>

          <div className="divider"></div>

          <div>
            <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
              Amount
            </label>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
              {formatAmount(claim.amount)} {tokenName}
            </p>
          </div>

          <div className="divider"></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
                Status
              </label>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  background: claim.status === "CREATED"
                    ? "rgba(34, 199, 108, 0.15)"
                    : claim.status === "CLAIMED"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(139, 92, 246, 0.15)",
                  color: claim.status === "CREATED"
                    ? "var(--primary)"
                    : claim.status === "CLAIMED"
                      ? "#3b82f6"
                      : "#8b5cf6",
                }}
              >
                {claim.status}
              </span>
            </div>

            <div>
              <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
                Expires
              </label>
              <p style={{ fontSize: "0.9rem", color: isExpired ? "#ef4444" : "inherit" }}>
                {formatDate(claim.expiry)}
              </p>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
              From Address
            </label>
            <p style={{ fontFamily: "monospace", fontSize: "0.875rem", wordBreak: "break-all" }}>
              {claim.payerAddress}
            </p>
          </div>

          {claim.recipientMasked && (
            <>
              <div className="divider"></div>
              <div>
                <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
                  Restricted to Recipient
                </label>
                <p style={{ fontFamily: "monospace", fontSize: "0.875rem", wordBreak: "break-all" }}>
                  {claim.recipientMasked}
                </p>
              </div>
            </>
          )}

          <div className="divider"></div>

          <div>
            <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
              Token Type
            </label>
            <p style={{ fontSize: "0.9rem" }}>
              {claim.isNative ? "Native CELO" : `ERC20 Token (${tokenName})`}
            </p>
          </div>
        </div>

        <div className="spacer-lg"></div>

        {!isClaimed && !isReclaimed && !isExpired && isConnected && (
          <>
            {claim.requiresSecret ? (
              <div onSubmit={handleSubmit(onSubmit)}>
                <div style={{ marginBottom: "1rem" }}>
                  <label htmlFor="secret" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                    Secret Required
                  </label>
                  <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                    This claim requires a secret to proceed. Enter the secret provided by the sender.
                  </p>
                  <input
                    id="secret"
                    type="text"
                    className="input"
                    placeholder="Enter secret"
                    {...register("secret")}
                    disabled={isProcessing}
                  />
                  {errors.secret && (
                    <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                      {errors.secret.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSubmit(onSubmit)}
                  className="btn btn-primary"
                  disabled={isProcessing || !!(claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase())}
                  style={{
                    width: "100%",
                    opacity: isProcessing || (claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase()) ? 0.6 : 1,
                    cursor: isProcessing || (claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase()) ? "not-allowed" : "pointer",
                  }}
                >
                  {isProcessing ? "Processing..." : "Claim Payment"}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleClaimWithoutSecret}
                disabled={isProcessing || !!(claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase())}
                style={{
                  width: "100%",
                  opacity: isProcessing || (claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase()) ? 0.6 : 1,
                  cursor: isProcessing || (claim.recipientMasked && address?.toLowerCase() !== claim.recipientMasked.toLowerCase()) ? "not-allowed" : "pointer",
                }}
              >
                {isProcessing ? "Processing..." : "Claim Payment"}
              </button>
            )}
          </>
        )}

        {claimSuccess && claimTxHash && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(34, 199, 108, 0.15)",
            border: "1px solid var(--primary)",
            borderRadius: "8px"
          }}>
            <p style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
              ✓ Claim processed successfully!
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              The funds have been transferred to your wallet.
            </p>
            <a
              href={`https://celoscan.io/tx/${claimTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
              style={{ marginTop: "0.5rem", display: "inline-block" }}
            >
              View Transaction
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { waitForTransactionReceipt } from '@wagmi/core';
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { PaylinkService } from "../services/paylink";
import { TOKEN_ADDRESSES } from "../libs/constants";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../libs/contract";
import { config } from "../libs/config";
import { useEffect, useState } from "react";

const claimSchema = z.object({
  secret: z.string().min(1, "Secret is required"),
});

type ClaimFormData = z.infer<typeof claimSchema>;

const getClaim = async (claimCode: string) => {
  try {
    const res = await PaylinkService.getClaim(claimCode);
    return res.data;
  } catch (error) {
    console.error("Error fetching claim:", error);
    throw error;
  }
};

export default function Claim() {
  const { claimCode } = useParams();
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["claim", claimCode],
    queryFn: () => getClaim(claimCode as string),
    enabled: !!claimCode,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
  });

  // Contract write hook
  const { writeContractAsync: claimAsync, isPending: isClaiming } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isWaitingClaim, data: claimReceipt } = useWaitForTransactionReceipt({
    hash: claimTxHash as `0x${string}`,
    query: {
      enabled: !!claimTxHash,
    },
  });

  // Backend mutation to update claim status
  const backendMutation = useMutation({
    mutationFn: async (payload: { claimCode: string; txHashClaim: string }) => {
      const response = await PaylinkService.confirmClaim(payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Claim successfully processed!");
      refetch();
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      console.error('Backend error:', error);
      const message = 'response' in error ? error.response?.data?.message : (error instanceof Error ? error.message : 'Unknown error');
      toast.error(`Backend error: ${message}`);
    },
  });

  // Handle claim receipt
  useEffect(() => {
    if (claimReceipt && claimCode) {
      toast.success("Blockchain claim successful!");

      // Update backend
      backendMutation.mutate({
        claimCode,
        txHashClaim: claimReceipt.transactionHash
      });
    }
  }, [claimReceipt, claimCode]);

  // Handle smart contract claim
  const handleClaimContract = async (secret?: string) => {
    if (!claim) {
      toast.error("Claim data not available");
      return;
    }

    try {
      const secretBytes = secret
        ? ethers.hexlify(ethers.toUtf8Bytes(secret))
        : ethers.hexlify(ethers.toUtf8Bytes(""));

      toast.info("Submitting claim to blockchain...");

      const hash = await claimAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "claim",
        args: [BigInt(claim.claimId), secretBytes],
      });

      toast.info("Waiting for confirmation...");

      const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

      if (receipt.status === 'success') {
        setClaimTxHash(hash);
      } else {
        toast.error("Transaction failed");
      }
    } catch (error: Error | unknown) {
      console.error('Claim error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to claim: ${message}`);
    }
  };

  const onSubmit = (formData: ClaimFormData) => {
    handleClaimContract(formData.secret);
  };

  const handleClaimWithoutSecret = () => {
    handleClaimContract();
  };

  const getTokenName = (address: string) => {
    const normalizedAddress = address.toLowerCase();

    // Check for native token (CELO)
    if (address === "0x0000000000000000000000000000000000000000") {
      return "CELO";
    }

    // Check against known token addresses
    const tokenEntry = Object.entries(TOKEN_ADDRESSES).find(
      ([, tokenAddress]) => tokenAddress.toLowerCase() === normalizedAddress
    );

    return tokenEntry ? tokenEntry[0] : "Unknown Token";
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isProcessing = isClaiming || isWaitingClaim || backendMutation.isPending;

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="card">
          <p className="muted">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="card">
          <h2 style={{ color: "#ef4444" }}>Failed to load claim</h2>
          <p className="muted">Please check the claim code and try again.</p>
        </div>
      </div>
    );
  }

  const claim = data?.data?.claim;

  if (!claim) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="card">
          <p className="muted">No claim data available.</p>
        </div>
      </div>
    );
  }

  const tokenName = getTokenName(claim.token);
  const isExpired = new Date(claim.expiry) < new Date();
  const isClaimed = claim.status === "CLAIMED";

  return (
    <div className="container" style={{ paddingTop: "2rem", maxWidth: "48rem" }}>
      <div className="card">
        <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>
          Claim Payment
        </h1>
        <p className="muted">Review the details below and claim your payment</p>

        <div className="spacer-lg"></div>

        {/* Status Alerts */}
        {isClaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(34, 199, 108, 0.15)",
            border: "1px solid var(--primary)",
            borderRadius: "8px"
          }}>
            <p style={{ color: "var(--primary)", fontWeight: 600 }}>
              ✓ This claim has already been processed
            </p>
          </div>
        )}

        {isExpired && !isClaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#ef4444", fontWeight: 600 }}>
              ⚠️ This claim has expired
            </p>
          </div>
        )}

        {/* Claim Details */}
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
                      : "rgba(255, 255, 255, 0.1)",
                  color: claim.status === "CREATED"
                    ? "var(--primary)"
                    : claim.status === "CLAIMED"
                      ? "#3b82f6"
                      : "var(--muted)",
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
                  Recipient
                </label>
                <p style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                  {claim.recipientMasked}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="spacer-lg"></div>

        {/* Claim Actions - Only show if not claimed and not expired */}
        {!isClaimed && !isExpired && (
          <>
            {/* Secret Form */}
            {claim.requiresSecret && (
              <form onSubmit={handleSubmit(onSubmit)}>
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
                  type="submit"
                  className="btn btn-primary"
                  disabled={isProcessing}
                  style={{
                    width: "100%",
                    opacity: isProcessing ? 0.6 : 1,
                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  {isClaiming
                    ? "Submitting to blockchain..."
                    : isWaitingClaim
                      ? "Waiting for confirmation..."
                      : backendMutation.isPending
                        ? "Finalizing..."
                        : "Claim Payment"}
                </button>
              </form>
            )}

            {!claim.requiresSecret && (
              <button
                className="btn btn-primary"
                onClick={handleClaimWithoutSecret}
                disabled={isProcessing}
                style={{
                  width: "100%",
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                }}
              >
                {isClaiming
                  ? "Submitting to blockchain..."
                  : isWaitingClaim
                    ? "Waiting for confirmation..."
                    : backendMutation.isPending
                      ? "Finalizing..."
                      : "Claim Payment"}
              </button>
            )}
          </>
        )}

        {/* Success Message with Transaction Link */}
        {claimReceipt && (
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
            <a
              href={`https://celoscan.io/tx/${claimReceipt.transactionHash}`}
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
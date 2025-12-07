import { useParams, useNavigate } from "react-router";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from '@wagmi/core';
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useState, useMemo } from "react";
import { TOKEN_ADDRESSES } from "../libs/constants";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../libs/contract";
import { config } from "../libs/config";

export default function Reclaim() {
  const { claimCode } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [reclaimTxHash, setReclaimTxHash] = useState<string | null>(null);
  const [reclaimSuccess, setReclaimSuccess] = useState(false);

  // Fetch claim data from smart contract using claim ID
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
      enabled: claimCode !== null,
    }
  });

  const { writeContractAsync: reclaimAsync } = useWriteContract();

  // Parse claim data
  const claim = useMemo(() => {
    if (!claimData || claimCode === null) return null;

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
    ] = Array.from(claimData) as [
      bigint,
      string,
      string,
      bigint,
      bigint,
      boolean,
      number,
      string,
      boolean,
      boolean
    ];

    let status: 'CREATED' | 'CLAIMED' | 'RECLAIMED' = 'CREATED';
    if (statusEnum === 1) {
      status = 'CLAIMED';
    } else if (statusEnum === 2) {
      status = 'RECLAIMED';
    }

    return {
      id,
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

  const handleReclaimContract = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!claim) {
      toast.error("Claim data not available");
      return;
    }

    if (claim.payerAddress.toLowerCase() !== address.toLowerCase()) {
      toast.error("Only the payer can reclaim this payment");
      return;
    }

    try {
      setIsProcessing(true);
      toast.info("Submitting reclaim to blockchain...");

      const hash = await reclaimAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "reclaim",
        args: [claimCode as string],
      });

      toast.info("Waiting for confirmation...");

      const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

      if (receipt.status === 'success') {
        setReclaimTxHash(hash);
        setReclaimSuccess(true);
        toast.success("Funds reclaimed successfully!");
        
        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        toast.error("Transaction failed");
      }
    } catch (error: any) {
      console.error('Reclaim error:', error);
      const message = error?.cause?.cause?.shortMessage || 
                     error?.cause?.shortMessage ||
                     error?.shortMessage ||
                     error?.message || 
                     'Unknown error occurred';
      toast.error(`Failed to reclaim: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTokenName = (tokenAddress: string) => {
    const normalizedAddress = tokenAddress.toLowerCase();

    if (tokenAddress === ethers.ZeroAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      return "CELO";
    }

    const tokenEntry = Object.entries(TOKEN_ADDRESSES).find(
      ([, address]) => address.toLowerCase() === normalizedAddress
    );

    return tokenEntry ? tokenEntry[0] : "Unknown";
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch (error) {
      console.log(error);
      toast.error("Failed to copy");
    }
  };

  if (claimCode === null) {
    return (
      <div className="container" style={{ paddingTop: "2rem", maxWidth: "48rem" }}>
        <div className="card">
          <h2 style={{ color: "#ef4444" }}>Invalid Claim ID</h2>
          <p className="muted">The claim code provided is invalid.</p>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/reclaim")}
            style={{ marginTop: "1rem" }}
          >
            ← Back to My Claims
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: "2rem", maxWidth: "48rem" }}>
        <div className="card">
          <p className="muted">Loading claim details...</p>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="container" style={{ paddingTop: "2rem", maxWidth: "48rem" }}>
        <div className="card">
          <h2 style={{ color: "#ef4444" }}>Failed to load claim</h2>
          <p className="muted">
            {error ? "Claim does not exist or there was an error loading it." : "No claim data available."}
          </p>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/reclaim")}
            style={{ marginTop: "1rem" }}
          >
            ← Back to My Claims
          </button>
        </div>
      </div>
    );
  }

  const tokenName = getTokenName(claim.token);
  const isExpired = new Date(claim.expiry) < new Date();
  const isClaimed = claim.status === "CLAIMED";
  const isReclaimed = claim.status === "RECLAIMED";
  const canReclaim = isExpired && claim.status === "CREATED" && isConnected &&
    claim.payerAddress.toLowerCase() === address?.toLowerCase();

  return (
    <div className="container" style={{ paddingTop: "2rem", maxWidth: "48rem" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.875rem", margin: 0 }}>
            {isReclaimed ? "Reclaimed Payment" : canReclaim ? "Reclaim Funds" : "Payment Details"}
          </h1>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/reclaim")}
            style={{ padding: "0.5rem 0.75rem" }}
          >
            ← Back
          </button>
        </div>
        <p className="muted">
          {canReclaim
            ? "Review the details and reclaim your funds"
            : "View payment details and status"}
        </p>

        <div className="spacer-lg"></div>

        {/* Status Alerts */}
        {isReclaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(34, 199, 108, 0.15)",
            border: "1px solid var(--primary)",
            borderRadius: "8px"
          }}>
            <p style={{ color: "var(--primary)", fontWeight: 600 }}>
              ✓ You have successfully reclaimed this payment
            </p>
          </div>
        )}

        {isClaimed && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid #3b82f6",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#3b82f6", fontWeight: 600 }}>
              ℹ️ This payment was claimed by the recipient
            </p>
          </div>
        )}

        {!isExpired && claim.status === "CREATED" && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(255, 193, 7, 0.15)",
            border: "1px solid #ffc107",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#ffc107", fontWeight: 600 }}>
              ⏳ This payment has not expired yet. Reclaim will be available after expiry.
            </p>
          </div>
        )}

        {isConnected && isExpired && claim.status === "CREATED" &&
          claim.payerAddress.toLowerCase() !== address?.toLowerCase() && (
            <div style={{
              padding: "1rem",
              marginBottom: "1rem",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "8px"
            }}>
              <p style={{ color: "#ef4444", fontWeight: 600 }}>
                ⚠️ Only the original payer can reclaim this payment
              </p>
            </div>
          )}

        {!isConnected && claim.status === "CREATED" && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(255, 193, 7, 0.15)",
            border: "1px solid #ffc107",
            borderRadius: "8px"
          }}>
            <p style={{ color: "#ffc107", fontWeight: 600 }}>
              Please connect your wallet to reclaim this payment
            </p>
          </div>
        )}

        {canReclaim && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "rgba(34, 199, 108, 0.15)",
            border: "1px solid var(--primary)",
            borderRadius: "8px"
          }}>
            <p style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.95rem" }}>
              ✓ This payment is eligible for reclaim. You can get your funds back.
            </p>
          </div>
        )}

        {/* Claim Details */}
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
              Claim ID
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <p style={{ fontFamily: "monospace", fontSize: "1.125rem", fontWeight: 600, flex: 1 }}>
                #{claim.id}
              </p>
              <button
                className="btn btn-ghost"
                onClick={() => copyToClipboard(claimCode ?? "", "Claim ID")}
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
              >
                Copy
              </button>
            </div>
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
                    ? isExpired
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(255, 193, 7, 0.15)"
                    : claim.status === "CLAIMED"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(34, 199, 108, 0.15)",
                  color: claim.status === "CREATED"
                    ? isExpired
                      ? "#ef4444"
                      : "#ffc107"
                    : claim.status === "CLAIMED"
                      ? "#3b82f6"
                      : "var(--primary)",
                }}
              >
                {claim.status}
              </span>
            </div>

            <div>
              <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
                Expiry
              </label>
              <p style={{ fontSize: "0.9rem", color: isExpired ? "#ef4444" : "inherit" }}>
                {formatDate(claim.expiry)}
                {isExpired && " (Expired)"}
              </p>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
              Payer Address
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
                  Intended Recipient
                </label>
                <p style={{ fontFamily: "monospace", fontSize: "0.875rem", wordBreak: "break-all" }}>
                  {claim.recipientMasked}
                </p>
              </div>
            </>
          )}

          {claim.requiresSecret && (
            <>
              <div className="divider"></div>
              <div>
                <label className="muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>
                  Secret Protection
                </label>
                <p style={{ fontSize: "0.9rem" }}>🔒 Protected with secret</p>
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

        {/* Reclaim Action */}
        {canReclaim && !reclaimSuccess && (
          <button
            className="btn btn-primary"
            onClick={handleReclaimContract}
            disabled={isProcessing}
            style={{
              width: "100%",
              opacity: isProcessing ? 0.6 : 1,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            {isProcessing
              ? "Processing..."
              : `Reclaim ${formatAmount(claim.amount)} ${tokenName}`}
          </button>
        )}

        {/* Success Message with Transaction Link */}
        {reclaimSuccess && reclaimTxHash && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(34, 199, 108, 0.15)",
            border: "1px solid var(--primary)",
            borderRadius: "8px"
          }}>
            <p style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
              ✓ Funds reclaimed successfully!
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              The funds have been returned to your wallet.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
              <a
                href={`https://celoscan.io/tx/${reclaimTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
                style={{ display: "inline-block" }}
              >
                View Transaction
              </a>
              <button
                className="btn-ghost"
                onClick={() => navigate("/reclaim")}
              >
                Back to My Claims
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
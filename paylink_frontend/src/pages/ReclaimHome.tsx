import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { NavLink, useNavigate } from "react-router";
import { useMemo } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../libs/contract";
import { TOKEN_ADDRESSES } from "../libs/constants";

export default function ReclaimHome() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  // First, get the array of claim IDs for this user
  const {
    isLoading: isLoadingClaimIds, 
    data: claimIds,
    error: claimIdsError
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getUserClaims",
    args: [address as `0x${string}`],
    query: {
      enabled: isConnected && !!address,
    }
  });

  // Prepare contracts array for batch reading claim details
  const claimContracts = useMemo(() => {
    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return [];
    }

    return claimIds.map((claimId: bigint) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'getClaimPublic',
      args: [claimId],
    }));
  }, [claimIds]);

  // Batch read all claim details
  const {
    data: claimsData,
    isLoading: isLoadingClaims,
  } = useReadContracts({
    contracts: claimContracts,
    query: {
      enabled: claimContracts.length > 0,
    }
  });

  // Transform the data into a usable format
  const claims = useMemo(() => {
    if (!claimIds || !claimsData || !Array.isArray(claimIds)) {
      return [];
    }

    return claimIds.map((claimId: bigint, index: number) => {
      const claimData = claimsData[index];
      
      if (!claimData || claimData.status === 'failure' || !claimData.result) {
        return null;
      }

      const [
        payer,
        token,
        amount,
        expiry,
        claimed,
        statusEnum,
        recipientMasked,
        requiresSecret,
        isNative
      ] = claimData.result as unknown as [string, string, bigint, bigint, boolean, number, string, boolean, boolean];

      let status: 'CREATED' | 'CLAIMED' | 'RECLAIMED' = 'CREATED';
      if (statusEnum === 1) {
        status = 'CLAIMED';
      } else if (statusEnum === 2) {
        status = 'RECLAIMED';
      }

      const expiryTimestamp = Number(expiry);

      return {
        claimId: Number(claimId),
        payer,
        token,
        amount: amount.toString(),
        expiry: expiryTimestamp * 1000,
        status,
        claimed,
        recipient: recipientMasked,
        requiresSecret,
        isNative,
        createdAt: Date.now() - (index * 1000 * 60 * 60),
      };
    }).filter(Boolean);
  }, [claimIds, claimsData]);

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
    return new Date(timestamp).toLocaleDateString();
  };

  const isExpired = (expiryTimestamp: number) => {
    return new Date(expiryTimestamp) < new Date();
  };

  const canReclaim = (claim: any) => {
    return isExpired(claim.expiry) && claim.status === "CREATED";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return { bg: "rgba(255, 193, 7, 0.15)", color: "#ffc107" };
      case "CLAIMED":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" };
      case "RECLAIMED":
        return { bg: "rgba(34, 199, 108, 0.15)", color: "var(--primary)" };
      default:
        return { bg: "rgba(255, 255, 255, 0.1)", color: "var(--muted)" };
    }
  };

  const isLoading = isLoadingClaimIds || isLoadingClaims;
  const error = claimIdsError;

  if (!isConnected) {
    return (
      <div className="container" style={{ paddingTop: "3rem", maxWidth: "48rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), var(--primary-600))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            margin: "0 auto 1.5rem"
          }}>
            🔌
          </div>
          <h2 style={{ marginBottom: "0.5rem" }}>Connect Your Wallet</h2>
          <p className="muted">
            Please connect your wallet to view and reclaim your payments
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: "2rem", maxWidth: "64rem" }}>
        <div className="card">
          <p className="muted">Loading your claims...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: "2rem", maxWidth: "64rem" }}>
        <div className="card">
          <h2 style={{ color: "#ef4444" }}>Failed to load claims</h2>
          <p className="muted">Please try again later.</p>
        </div>
      </div>
    );
  }

  const validClaims = claims.filter((claim): claim is NonNullable<typeof claim> => claim !== null);
  const reclaimableClaims = validClaims.filter(claim => canReclaim(claim));
  const activeClaims = validClaims.filter(claim => claim.status === "CREATED" && !isExpired(claim.expiry));
  const completedClaims = validClaims.filter(claim => claim.status === "CLAIMED" || claim.status === "RECLAIMED");

  return (
    <div className="container" style={{ paddingTop: "2rem", maxWidth: "64rem" }}>
      <div className="card">
        <h1 style={{ fontSize: "1.875rem", marginBottom: "0.5rem" }}>
          My Payment Links
        </h1>
        <p className="muted">View and manage all your created payment links</p>

        <div className="spacer-lg"></div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{
            padding: "1rem",
            background: "rgba(255, 193, 7, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 193, 7, 0.3)"
          }}>
            <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>Active</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffc107" }}>{activeClaims.length}</p>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }}>
            <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>Reclaimable</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>{reclaimableClaims.length}</p>
          </div>

          <div style={{
            padding: "1rem",
            background: "rgba(34, 199, 108, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(34, 199, 108, 0.3)"
          }}>
            <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>Completed</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>{completedClaims.length}</p>
          </div>
        </div>

        {claims.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ marginBottom: "0.5rem" }}>No Payment Links Found</h3>
            <p className="muted">You haven't created any payment links yet.</p>
            <NavLink to="/create" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Create Your First Paylink
            </NavLink>
          </div>
        ) : (
          <>
            {/* Reclaimable Claims Section */}
            {reclaimableClaims.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#ef4444" }}>
                  💰 Reclaimable ({reclaimableClaims.length})
                </h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {reclaimableClaims.map((claim) => {
                    const tokenName = getTokenName(claim.token);
                    return (
                      <div
                        key={claim.claimId}
                        className="card"
                        style={{
                          padding: "1rem",
                          cursor: "pointer",
                          border: "2px solid rgba(239, 68, 68, 0.3)",
                          transition: "transform 0.2s ease, border-color 0.2s ease"
                        }}
                        onClick={() => navigate(`/reclaim/claim-${claim.claimId}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.borderColor = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.25rem" }}>
                              {formatAmount(claim.amount)} {tokenName}
                            </p>
                            <p className="muted" style={{ fontSize: "0.875rem" }}>
                              Claim #{claim.claimId}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "0.875rem", color: "#ef4444", marginBottom: "0.5rem", fontWeight: 600 }}>
                              Expired {formatDate(claim.expiry)}
                            </p>
                            <button className="btn btn-ghost" style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}>
                              Reclaim →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Claims Section */}
            {activeClaims.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#ffc107" }}>
                  ⏳ Active ({activeClaims.length})
                </h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {activeClaims.map((claim) => {
                    const tokenName = getTokenName(claim.token);
                    const statusStyle = getStatusColor(claim.status);
                    return (
                      <div
                        key={claim.claimId}
                        className="card"
                        style={{
                          padding: "1rem",
                          cursor: "pointer",
                          transition: "transform 0.2s ease"
                        }}
                        onClick={() => navigate(`/reclaim/claim-${claim.claimId}`)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                              {formatAmount(claim.amount)} {tokenName}
                            </p>
                            <p className="muted" style={{ fontSize: "0.875rem" }}>
                              Claim #{claim.claimId}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                marginBottom: "0.5rem"
                              }}
                            >
                              {claim.status}
                            </span>
                            <p className="muted" style={{ fontSize: "0.875rem" }}>
                              Expires {formatDate(claim.expiry)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Claims Section */}
            {completedClaims.length > 0 && (
              <div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "var(--primary)" }}>
                  ✓ Completed ({completedClaims.length})
                </h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {completedClaims.map((claim) => {
                    const tokenName = getTokenName(claim.token);
                    const statusStyle = getStatusColor(claim.status);
                    return (
                      <div
                        key={claim.claimId}
                        className="card"
                        style={{
                          padding: "1rem",
                          cursor: "pointer",
                          opacity: 0.8,
                          transition: "opacity 0.2s ease, transform 0.2s ease"
                        }}
                        onClick={() => navigate(`/reclaim/claim-${claim.claimId}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "0.8";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                              {formatAmount(claim.amount)} {tokenName}
                            </p>
                            <p className="muted" style={{ fontSize: "0.875rem" }}>
                              Claim #{claim.claimId}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                background: statusStyle.bg,
                                color: statusStyle.color,
                              }}
                            >
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import { useCallback, useMemo, useState, useEffect } from "react";
import { useAccount, useDisconnect, useEnsName, useEnsAvatar, useChainId, useBalance, useChains, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { HiOutlineChevronDown, HiOutlineLogout, HiOutlineClipboard, HiSwitchHorizontal } from "react-icons/hi";

export default function CustomConnectButton({ mobile = false }: { mobile?: boolean }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: address });
  const chainId = useChainId();
  const chains = useChains();
  const { data: balance } = useBalance({ address });
  const { switchChain } = useSwitchChain();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close menu on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const currentChain = useMemo(() => {
    return chains.find(chain => chain.id === chainId);
  }, [chains, chainId]);

  const networkName = useMemo(() => {
    return currentChain?.name || "Unknown Network";
  }, [currentChain]);

  const formattedBalance = useMemo(() => {
    if (!balance) return "0.000";
    const balanceNum = parseFloat(balance.formatted);
    if (balanceNum < 0.001) return "< 0.001";
    return balanceNum.toFixed(3);
  }, [balance]);

  const label = useMemo(() => {
    if (!isConnected) return "Connect Wallet";
    if (ensName) return ensName;
    if (address) return shortenAddress(address);
    return "Connected";
  }, [isConnected, ensName, address]);

  const handleOpen = useCallback(async () => {
    if (!isConnected) {
      if (openConnectModal) openConnectModal();
      return;
    }
    setMenuOpen((s) => !s);
  }, [isConnected, openConnectModal]);

  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.log(error)
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    setMenuOpen(false);
    disconnect();
  }, [disconnect]);

  const handleSwitchNetwork = useCallback((targetChainId: number) => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
      setMenuOpen(false);
    }
  }, [switchChain]);

  // Get the "other" network (if on mainnet, show sepolia; if on sepolia, show mainnet)
  const alternativeChain = useMemo(() => {
    const celoMainnetId = 42220;
    const celoAlfajoresId = 44787;

    if (chainId === celoMainnetId) {
      return chains.find(c => c.id === celoAlfajoresId);
    } else {
      return chains.find(c => c.id === celoMainnetId);
    }
  }, [chainId, chains]);

  const isMainnet = chainId === 42220;

  return (
    <div className={`relative inline-block text-left ${mobile ? 'w-full' : ''}`}>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:scale-[1.02] ${mobile ? 'w-full justify-between' : ''}`}
        style={{
          background: "rgba(139, 92, 246, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          color: "var(--text)",
        }}
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        <div className="flex items-center gap-2">
          {/* avatar with gradient */}
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%)" }}
          >
            {ensAvatar ? (
              <img src={ensAvatar} alt="avatar" width={32} height={32} className="object-cover" />
            ) : (
              <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{(ensName ?? shortenAddress(address ?? "")).slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          {/* label and details */}
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</span>
            {isConnected && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formattedBalance} {balance?.symbol || "CELO"}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isMainnet ? "var(--accent-green)" : "#fbbf24" }}
                  ></div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {isMainnet ? "Mainnet" : "Testnet"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <HiOutlineChevronDown
          className="ml-2 text-[18px] transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)"
          }}
        />
      </button>

      {/* Dropdown menu */}
      {menuOpen && isConnected && (
        <>
          {/* Backdrop to close menu - only on desktop or if we want to close by clicking outside */}
          {!mobile && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
          )}

          <div
            role="menu"
            className={`${mobile ? 'relative w-full mt-2' : 'absolute right-0 mt-2 w-72'} rounded-2xl shadow-xl z-50 glass-card`}
            style={{
              background: "rgba(14, 32, 48, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              boxShadow: mobile ? "none" : "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="py-3">
              {/* Header with avatar and name */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%)" }}
                >
                  {ensAvatar ? (
                    <img src={ensAvatar} alt="avatar" width={40} height={40} className="object-cover" />
                  ) : (
                    <span style={{ color: "white", fontSize: 16, fontWeight: 700 }}>{(ensName ?? shortenAddress(address ?? "")).slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: "var(--text)" }}>
                    {ensName ?? shortenAddress(address ?? "")}
                  </div>
                  <div className="text-xs font-mono truncate" style={{ color: "var(--text-muted)" }}>
                    {shortenAddress(address ?? "")}
                  </div>
                </div>
              </div>

              {/* Balance and network info */}
              <div className="px-4 py-3 mx-3 rounded-xl" style={{ background: "rgba(139, 92, 246, 0.05)" }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Balance</span>
                  <span className="text-base font-bold gradient-text">
                    {formattedBalance} {balance?.symbol || "CELO"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Network</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: isMainnet ? "var(--accent-green)" : "#fbbf24" }}
                    ></div>
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {networkName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Network Switcher */}
              {alternativeChain && (
                <>
                  <div className="mt-1 mx-3 border-t" style={{ borderColor: "rgba(139, 92, 246, 0.1)" }} />

                  <div className="px-3 py-2">
                    <button
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between rounded-xl transition-all hover:scale-[1.01]"
                      onClick={() => handleSwitchNetwork(alternativeChain.id)}
                      style={{
                        background: "rgba(139, 92, 246, 0.1)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                        color: "var(--text)"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <HiSwitchHorizontal className="text-lg" style={{ color: "var(--accent-purple)" }} />
                        <div>
                          <div className="text-sm font-semibold">Switch Network</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Switch to {alternativeChain.name}
                          </div>
                        </div>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: alternativeChain.id === 42220 ? "var(--accent-green)" : "#fbbf24" }}
                      ></div>
                    </button>
                  </div>
                </>
              )}

              <div className="mt-1 mx-3 border-t" style={{ borderColor: "rgba(139, 92, 246, 0.1)" }} />

              {/* Action buttons */}
              <div className="px-3 py-2">
                <button
                  className="w-full px-3 py-2 text-left flex items-center gap-2 rounded-lg transition-colors hover:bg-[rgba(139,92,246,0.1)]"
                  onClick={() => { handleCopy(); setMenuOpen(false); }}
                  style={{ color: "var(--text)" }}
                >
                  <HiOutlineClipboard className="text-lg" />
                  <span className="text-sm font-medium">{copied ? "✓ Copied!" : "Copy Address"}</span>
                </button>

                <button
                  className="w-full px-3 py-2 text-left flex items-center gap-2 rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                  onClick={() => { handleDisconnect(); }}
                  style={{ color: "#ef4444" }}
                >
                  <HiOutlineLogout className="text-lg" />
                  <span className="text-sm font-medium">Disconnect</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function shortenAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
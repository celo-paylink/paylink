"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useAccount, useDisconnect, useEnsName, useEnsAvatar, useChainId, useBalance, useChains } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { HiOutlineChevronDown, HiOutlineLogout, HiOutlineClipboard } from "react-icons/hi";

export default function CustomConnectButton() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: address });
  const chainId = useChainId();
  const chains = useChains();
  const { data: balance } = useBalance({ address });

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    } catch {
    }
  }, [address]);

  const handleDisconnect = useCallback(() => {
    setMenuOpen(false);
    disconnect();
  }, [disconnect]);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 rounded-xl px-3 py-2 border"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        <div className="flex items-center gap-2">
          {/* avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(90deg, var(--primary), var(--primary-600))" }}>
            {ensAvatar ? (
              <Image src={ensAvatar} alt="avatar" width={32} height={32} className="object-cover" />
            ) : (
              <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{(ensName ?? shortenAddress(address ?? "")).slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          {/* label and details */}
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</span>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {formattedBalance} {balance?.symbol || "ETH"}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>•</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {networkName}
                </span>
              </div>
            )}
          </div>
        </div>

        <HiOutlineChevronDown className="ml-2 text-[18px]" style={{ color: "var(--muted)" }} />
      </button>

      {/* Dropdown menu */}
      {menuOpen && isConnected && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg z-50"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--soft-shadow)" }}
        >
          <div className="py-2">
            {/* Header with avatar and name */}
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(90deg, var(--primary), var(--primary-600))" }}>
                {ensAvatar ? (
                  <Image src={ensAvatar} alt="avatar" width={32} height={32} className="object-cover" />
                ) : (
                  <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{(ensName ?? shortenAddress(address ?? "")).slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <div style={{ color: "var(--text)", fontWeight: 700 }}>{ensName ?? shortenAddress(address ?? "")}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{shortenAddress(address ?? "")}</div>
              </div>
            </div>

            {/* Balance and network info */}
            <div className="px-3 py-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs" style={{ color: "var(--muted)" }}>Balance</span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {formattedBalance} {balance?.symbol || "ETH"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--muted)" }}>Network</span>
                <div className="flex items-center gap-1">
                  {currentChain?.blockExplorers?.default?.url && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--primary)" }}></div>
                  )}
                  <span className="text-sm" style={{ color: "var(--text)" }}>
                    {networkName}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.03)" }} />

            {/* Action buttons */}
            <button
              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[rgba(255,255,255,0.02)]"
              onClick={() => { handleCopy(); setMenuOpen(false); }}
              style={{ color: "var(--text)" }}
            >
              <HiOutlineClipboard /> <span className="text-sm"> {copied ? "Copied" : "Copy address"}</span>
            </button>

            <button
              className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[rgba(255,255,255,0.02)] rounded-b-xl"
              onClick={() => { handleDisconnect(); }}
              style={{ color: "var(--text)" }}
            >
              <HiOutlineLogout /> <span className="text-sm">Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function shortenAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
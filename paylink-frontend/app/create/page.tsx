"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { waitForTransactionReceipt } from '@wagmi/core';
import { ethers } from "ethers";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/libs/contract";
import { PaylinkService } from "@/services/paylink";
import { config } from "@/libs/config";

const ZERO_ADDRESS = ethers.ZeroAddress;
const ZERO_BYTES32 = ethers.ZeroHash;

// Constants
const TOKEN_ADDRESSES = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores cUSD
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F", // Alfajores cEUR
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545", // Alfajores cREAL
} as const;

const CHAIN_EXPLORERS = {
  44787: "https://alfajores.celoscan.io/tx/",
  42220: "https://explorer.celo.org/tx/",
  1: "https://etherscan.io/tx/",
  137: "https://polygonscan.com/tx/",
} as const;

// Types
interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative: boolean;
}

type TokenKey = keyof typeof TOKEN_ADDRESSES | 'CELO';

// Form data interface for persistence
interface PersistentFormData {
  selectedToken: string;
  amount: string;
  expiryDays: number;
  recipient: string;
  useSecret: boolean;
  secretPlain: string;
  isCustomSecret: boolean;
  secretHash: string;
  rawAmount: string;
  currentToken: TokenInfo;
}

// Token configurations
const TOKENS: Record<TokenKey, TokenInfo> = {
  CELO: {
    address: ZERO_ADDRESS,
    symbol: "CELO",
    name: "Celo",
    decimals: 18,
    isNative: true,
  },
  cUSD: {
    address: TOKEN_ADDRESSES.cUSD,
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
    isNative: false,
  },
  cEUR: {
    address: TOKEN_ADDRESSES.cEUR,
    symbol: "cEUR",
    name: "Celo Euro",
    decimals: 18,
    isNative: false,
  },
  cREAL: {
    address: TOKEN_ADDRESSES.cREAL,
    symbol: "cREAL",
    name: "Celo Real",
    decimals: 18,
    isNative: false,
  },
};

export const ERC20_ABI = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string", name: "" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [{ type: "bool", name: "" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "owner" },
      { type: "address", name: "spender" },
    ],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [{ type: "bool", name: "" }],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "from" },
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [{ type: "bool", name: "" }],
  },
] as const;

// Form validation schema
const formSchema = z.object({
  selectedToken: z.string().min(1, "Please select a token"),
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && isFinite(num);
    }, "Amount must be a valid positive number"),
  expiryDays: z.number()
    .min(1, "Expiry must be at least 1 day")
    .max(365, "Expiry cannot exceed 365 days"),
  recipient: z.string()
    .optional()
    .refine(
      (val) => !val || ethers.isAddress(val),
      "Invalid recipient address"
    ),
  useSecret: z.boolean(),
  secretPlain: z.string().optional(),
  isCustomSecret: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

// Utility functions
function hexFromRandomBytes(len = 16): string {
  const arr = new Uint8Array(len);
  window.crypto.getRandomValues(arr);
  return ethers.hexlify(arr);
}

function getExplorerTxUrl(chainId?: number, txHash?: string): string {
  if (!txHash) return "#";
  const base = chainId && CHAIN_EXPLORERS[chainId as keyof typeof CHAIN_EXPLORERS]
    ? CHAIN_EXPLORERS[chainId as keyof typeof CHAIN_EXPLORERS]
    : "https://explorer/tx/";
  return `${base}${txHash}`;
}

// Custom hook for transaction status
function useTransactionStatus() {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [createTxHash, setCreateTxHash] = useState<string | null>(null);
  const [claimId, setClaimId] = useState<number | null>(null);

  return {
    txHash,
    setTxHash,
    createTxHash,
    setCreateTxHash,
    claimId,
    setClaimId,
  };
}

export default function CreatePaylinkForm() {
  const { address } = useAccount();

  // Transaction status
  const {
    txHash,
    setTxHash,
    createTxHash,
    setCreateTxHash,
    claimId,
    setClaimId
  } = useTransactionStatus();

  // Form state
  const [claimLink, setClaimLink] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  
  // Persistent form data stored in ref to prevent loss during re-renders
  const persistentFormDataRef = useRef<PersistentFormData | null>(null);
  const [formDataSnapshot, setFormDataSnapshot] = useState<PersistentFormData | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedToken: "CELO",
      amount: "",
      expiryDays: 7,
      recipient: "",
      useSecret: false,
      secretPlain: "",
      isCustomSecret: false,
    },
  });

  const watchedValues = watch();
  const { useSecret, secretPlain, isCustomSecret, selectedToken } = watchedValues;

  const currentToken = useMemo(() =>
    TOKENS[selectedToken as TokenKey],
    [selectedToken]
  );

  const rawAmount = useMemo(() => {
    if (!watchedValues.amount || !currentToken) return BigInt(0);
    try {
      return ethers.parseUnits(watchedValues.amount, currentToken.decimals);
    } catch (error) {
      console.error('Error parsing amount:', error);
      return BigInt(0);
    }
  }, [watchedValues.amount, currentToken]);

  // Store form data snapshot whenever it changes
  useEffect(() => {
    if (currentToken && watchedValues.amount) {
      const snapshot: PersistentFormData = {
        selectedToken: watchedValues.selectedToken,
        amount: watchedValues.amount,
        expiryDays: watchedValues.expiryDays,
        recipient: watchedValues.recipient || "",
        useSecret: watchedValues.useSecret,
        secretPlain: watchedValues.secretPlain || "",
        isCustomSecret: watchedValues.isCustomSecret,
        secretHash: "",
        rawAmount: rawAmount.toString(),
        currentToken,
      };
      
      persistentFormDataRef.current = snapshot;
      setFormDataSnapshot(snapshot);
    }
  }, [watchedValues, currentToken, rawAmount]);

  // Token balance query
  const { data: tokenBalance } = useReadContract({
    address: currentToken?.isNative ? undefined : (currentToken?.address as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !currentToken?.isNative && !!address && !!currentToken?.address,
    },
  });

  // Contract write hooks
  const { writeContractAsync: createClaimAsync, isPending: isCreating } = useWriteContract();
  const { writeContractAsync: approveAsync } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isWaitingCreation, data: createReceipt } = useWaitForTransactionReceipt({
    hash: createTxHash as `0x${string}`,
    query: {
      enabled: !!createTxHash,
    },
  });

  // Handle create receipt
  useEffect(() => {
    if (createReceipt && persistentFormDataRef.current) {
      toast.success("Claim created successfully!");
      setTxHash(createReceipt.transactionHash);
      handleParseClaimId(createReceipt, persistentFormDataRef.current);
    }
  }, [createReceipt]);

  // Backend mutation with persistent data
  const backendMutation = useMutation({
    mutationFn: async (payload: Record<string, string | number | Date | null>) => {
      const response = await PaylinkService.createLink(payload);
      return response.data;
    },
    onSuccess: (data) => {
      const link = data?.data.link || `${window.location.origin}/claim/${data?.data.claim?.claimCode}`;
      setClaimLink(link);
      toast.success("Paylink ready to share!");
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      console.error('Backend error:', error);
      const message = 'response' in error ? error.response?.data?.message : (error instanceof Error ? error.message : 'Unknown error');
      toast.error(`Backend error: ${message}`);
    },
  });

  // Generate or validate secret using persistent data
  const ensureSecret = useCallback((formData?: PersistentFormData) => {
    const data = formData || persistentFormDataRef.current || formDataSnapshot;
    if (!data || !data.useSecret) return { secretPlain: "", secretHash: ZERO_BYTES32 };

    let plain = data.secretPlain;
    if (!data.isCustomSecret || !plain) {
      plain = hexFromRandomBytes(12);
      // Update the persistent ref
      if (persistentFormDataRef.current) {
        persistentFormDataRef.current.secretPlain = plain;
        persistentFormDataRef.current.isCustomSecret = false;
      }
    }

    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(plain));
    
    // Update persistent ref with computed hash
    if (persistentFormDataRef.current) {
      persistentFormDataRef.current.secretHash = secretHash;
    }
    
    return { secretPlain: plain, secretHash };
  }, [formDataSnapshot]);

  // Parse claim ID from transaction receipt
  const handleParseClaimId = useCallback((
    receipt: { logs: { address: string; topics: string[]; data: string; }[]; transactionHash: string; },
    formData: PersistentFormData
  ) => {
    let parsedClaimId: number | null = null;

    try {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;

        const iface = new ethers.Interface(CONTRACT_ABI);
        const parsed = iface.parseLog(log);

        if (parsed && parsed.name === "ClaimCreated") {
          parsedClaimId = Number(parsed.args[0]);
          break;
        }
      }
    } catch (error) {
      console.error('Error parsing claim ID:', error);
    }

    if (parsedClaimId === null) {
      toast.error("ClaimCreated event not found in transaction receipt");
      return;
    }

    setClaimId(parsedClaimId);
    handleBackendCall(parsedClaimId, receipt.transactionHash, formData);
  }, []);

  // Make backend API call with persistent form data
  const handleBackendCall = useCallback((
    claimId: number, 
    txHash: string, 
    formData: PersistentFormData
  ) => {
    const { secretHash } = ensureSecret(formData);
    const expiryDate = new Date(Date.now() + formData.expiryDays * 24 * 60 * 60 * 1000);
    
    const payload = {
      claimId,
      payerAddress: address!,
      token: formData.currentToken.address,
      amount: formData.rawAmount,
      expiry: expiryDate,
      recipient: formData.recipient || null,
      secretHash: secretHash === ZERO_BYTES32 ? null : secretHash,
      txHashCreate: txHash,
    };

    backendMutation.mutate(payload);
  }, [ensureSecret, address, backendMutation]);

  // Handle token approval
  const handleApprove = useCallback(async (formData: PersistentFormData): Promise<string | undefined> => {
    if (!formData.currentToken || formData.currentToken.isNative) return;

    try {
      setIsApproving(true);
      const amount = BigInt(formData.rawAmount);

      const hash = await approveAsync({
        address: formData.currentToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS as `0x${string}`, amount],
      });

      toast.info('Approval submitted. Waiting for confirmation...');
      const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

      if (receipt.status === 'success') {
        toast.success("Approval successful!");
        return hash;
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [approveAsync]);

  // Handle claim creation with form data capture
  const handleCreateClaim = useCallback(async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Capture current form data before any async operations
    const currentFormData = getValues();
    const formSnapshot: PersistentFormData = {
      selectedToken: currentFormData.selectedToken,
      amount: currentFormData.amount,
      expiryDays: currentFormData.expiryDays,
      recipient: currentFormData.recipient || "",
      useSecret: currentFormData.useSecret,
      secretPlain: currentFormData.secretPlain || "",
      isCustomSecret: currentFormData.isCustomSecret,
      secretHash: "",
      rawAmount: rawAmount.toString(),
      currentToken,
    };

    // Store in ref immediately
    persistentFormDataRef.current = formSnapshot;

    try {
      const { secretHash } = ensureSecret(formSnapshot);
      const expiryTs = Math.floor(Date.now() / 1000) + formSnapshot.expiryDays * 24 * 60 * 60;
      const recipientAddr = (formSnapshot.recipient && ethers.isAddress(formSnapshot.recipient))
        ? formSnapshot.recipient
        : ZERO_ADDRESS;

      let hash: string;

      if (formSnapshot.currentToken.isNative) {
        hash = await createClaimAsync({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: "createClaimNative",
          args: [
            BigInt(expiryTs),
            recipientAddr as `0x${string}`,
            secretHash as `0x${string}`,
          ],
          value: BigInt(formSnapshot.rawAmount),
        });

        toast.info("Creating native CELO claim. Please wait...");

        const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

        if (receipt.status === 'success') {
          toast.success("Claim creation successful!");
          setCreateTxHash(hash);
        }
      } else {
        const result = await handleApprove(formSnapshot);
        if (result) {
          hash = await createClaimAsync({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: "createClaimERC20",
            args: [
              formSnapshot.currentToken.address as `0x${string}`,
              BigInt(formSnapshot.rawAmount),
              BigInt(expiryTs),
              recipientAddr as `0x${string}`,
              secretHash as `0x${string}`,
            ],
          });
          toast.info("Creating ERC20 claim. Please wait...");

          const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

          if (receipt.status === 'success') {
            toast.success("Claim ERC20 creation successful!");
            setCreateTxHash(hash);
          }
        }
      }
    } catch (error: Error | unknown) {
      console.error('Create claim error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create claim: ${message}`);
      throw error;
    }
  }, [
    address,
    ensureSecret,
    currentToken,
    rawAmount,
    createClaimAsync,
    handleApprove,
    setCreateTxHash,
    getValues,
  ]);

  // Form submission handler
  const onSubmit = useCallback(async () => {
    try {
      await handleCreateClaim();
    } catch (error: unknown) {
      console.error('Submit error:', error);
    }
  }, [handleCreateClaim]);

  // Generate random secret
  const generateRandomSecret = useCallback(() => {
    const hex = hexFromRandomBytes(12);
    setValue("secretPlain", hex);
    setValue("isCustomSecret", false);
  }, [setValue]);

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  // Calculate loading state
  const isLoading = isSubmitting || isCreating || isWaitingCreation || backendMutation.isPending || isApproving;

  // Check for insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (currentToken?.isNative || !tokenBalance || !rawAmount || rawAmount === BigInt(0)) {
      return false;
    }
    return BigInt(tokenBalance.toString()) < rawAmount;
  }, [tokenBalance, rawAmount, currentToken?.isNative]);

  // Get expiry date string (use snapshot if available during loading)
  const expiryDateString = useMemo(() => {
    const expiryDays = formDataSnapshot?.expiryDays || watchedValues.expiryDays;
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    return expiryDate.toLocaleDateString();
  }, [watchedValues.expiryDays, formDataSnapshot?.expiryDays]);

  // Get the secret plain text to display (prefer snapshot during loading)
  const displaySecretPlain = formDataSnapshot?.secretPlain || 
    persistentFormDataRef.current?.secretPlain || 
    secretPlain;

  return (
    <div className="space-y-6 max-w-2xl mx-auto my-10">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
            Select Token
          </label>
          <Controller
            name="selectedToken"
            control={control}
            render={({ field }) => (
              <select {...field} className="input" disabled={isLoading}>
                {Object.entries(TOKENS).map(([key, token]) => (
                  <option key={key} value={key}>
                    {token.name} ({token.symbol})
                    {token.isNative && " - Native"}
                  </option>
                ))}
              </select>
            )}
          />
          {currentToken && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {currentToken.isNative
                ? "Native CELO - no approval required"
                : "ERC20 Token - approval may be required"}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
            Amount ({currentToken?.symbol})
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="input"
                placeholder="e.g. 10.00"
                disabled={isLoading}
                type="number"
                step="any"
                min="0"
              />
            )}
          />
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
          )}
          {hasInsufficientBalance && (
            <p className="text-red-400 text-sm mt-1">
              Insufficient {currentToken?.symbol} balance
            </p>
          )}
          {!currentToken?.isNative && tokenBalance && currentToken && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Balance: {ethers.formatUnits(String(tokenBalance), currentToken.decimals)} {currentToken.symbol}
            </p>
          )}
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
            Expiry (days)
          </label>
          <Controller
            name="expiryDays"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min={1}
                max={365}
                className="input"
                disabled={isLoading}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          {errors.expiryDays && (
            <p className="text-red-400 text-sm mt-1">{errors.expiryDays.message}</p>
          )}
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            After expiry, the payer can reclaim unclaimed funds. Expires: {expiryDateString}
          </p>
        </div>

        {/* Optional recipient */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
            Recipient (optional)
          </label>
          <Controller
            name="recipient"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="input"
                placeholder="0xabc... (leave blank to allow anyone)"
                disabled={isLoading}
              />
            )}
          />
          {errors.recipient && (
            <p className="text-red-400 text-sm mt-1">{errors.recipient.message}</p>
          )}
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            If provided, only this address can claim the paylink.
          </p>
        </div>

        {/* Secret toggle */}
        <div>
          <label className="inline-flex items-center gap-3">
            <Controller
              name="useSecret"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <span style={{ color: "var(--muted)" }}>Protect with a secret (optional)</span>
          </label>
        </div>

        {useSecret && (
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
              Secret
            </label>
            <div className="flex gap-3">
              <Controller
                name="secretPlain"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className="input flex-1"
                    placeholder="Custom secret (optional)"
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setValue("isCustomSecret", true);
                    }}
                  />
                )}
              />
              <button
                type="button"
                onClick={generateRandomSecret}
                className="btn-ghost"
                disabled={isLoading}
              >
                Auto-generate
              </button>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              The secret will be shown once after you create the link. Do not share it publicly unless you want anyone to claim.
            </p>
          </div>
        )}

        {/* Approval Notice */}
        {!currentToken?.isNative && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You need to approve the contract to spend your {currentToken?.symbol} tokens before creating the claim.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || hasInsufficientBalance || !address}
          >
            {!address
              ? "Connect Wallet"
              : isApproving
                ? "Approving..."
                : isCreating || isWaitingCreation
                  ? "Creating Claim..."
                  : backendMutation.isPending
                    ? "Finalizing..."
                    : "Create Paylink"}
          </button>

          {txHash && (
            <a
              href={getExplorerTxUrl(44787, txHash)} // Alfajores chain ID
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              View Transaction
            </a>
          )}
        </div>
      </form>

      {/* Success: show link + secret + QR */}
      {claimLink && formDataSnapshot && (
        <div className="mt-6 card">
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
            Paylink created successfully!
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Share this link with your recipient
          </p>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <input className="input flex-1" readOnly value={claimLink} />
            <button
              className="btn-ghost"
              onClick={() => copyToClipboard(claimLink, "Link copied to clipboard!")}
            >
              Copy Link
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {formDataSnapshot.useSecret && displaySecretPlain && (
              <div className="flex-1">
                <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                  Secret (save this now - shown only once)
                </p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 font-mono text-sm"
                    readOnly
                    value={displaySecretPlain}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => copyToClipboard(displaySecretPlain, "Secret copied to clipboard!")}
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs mt-1 text-amber-600">
                  ⚠️ Store this secret securely. You won&apos;t see it again!
                </p>
              </div>
            )}

            <div className="flex-shrink-0">
              <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                QR Code
              </p>
              <div className="p-3 bg-white rounded-lg border">
                <QRCodeSVG value={claimLink} size={128} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-600 rounded-lg">
            <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
              Claim Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span style={{ color: "var(--muted)" }}>Token: </span>
                <span style={{ color: "var(--text)" }}>
                  {formDataSnapshot.currentToken.name} ({formDataSnapshot.currentToken.symbol})
                </span>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Amount: </span>
                <span style={{ color: "var(--text)" }}>
                  {formDataSnapshot.amount} {formDataSnapshot.currentToken.symbol}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Expires: </span>
                <span style={{ color: "var(--text)" }}>{expiryDateString}</span>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Protected: </span>
                <span style={{ color: "var(--text)" }}>
                  {formDataSnapshot.useSecret ? "Yes (with secret)" : "No"}
                </span>
              </div>
              {formDataSnapshot.recipient && (
                <div className="md:col-span-2">
                  <span style={{ color: "var(--muted)" }}>Restricted to: </span>
                  <span style={{ color: "var(--text)" }} className="font-mono text-xs">
                    {formDataSnapshot.recipient}
                  </span>
                </div>
              )}
              {claimId !== null && (
                <div>
                  <span style={{ color: "var(--muted)" }}>Claim ID: </span>
                  <span style={{ color: "var(--text)" }}>{claimId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
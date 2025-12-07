import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from '@wagmi/core';
import { ethers } from "ethers";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../libs/contract";
import { config } from "../libs/config";
import { CHAIN_EXPLORERS, ERC20_ABI, TOKEN_ADDRESSES } from "../libs/constants";
import { generateClaimCode } from "../utils/claim-code";

const ZERO_ADDRESS = ethers.ZeroAddress;
const ZERO_BYTES32 = ethers.ZeroHash;

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
  claimCode?: string;
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
    : "https://explorer.celo.org/mainnet/tx/";
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

export default function CreatePaylinkPage() {
  const { address, chainId } = useAccount();

  const {
    txHash,
    setTxHash,
    setCreateTxHash,
    claimId,
    setClaimId,
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
    reset,
    formState: { errors, isSubmitting },
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
  const { useSecret, secretPlain, selectedToken } = watchedValues;

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

  // Extract claim ID from transaction logs
  const extractClaimIdFromReceipt = useCallback((receipt: any): number | null => {
    try {
      // Look for ClaimCreated event in logs
      const claimCreatedTopic = ethers.id("ClaimCreated(uint256,address,address,uint256,uint256,address,bytes32,string)");

      for (const log of receipt.logs) {
        if (log.topics[0] === claimCreatedTopic) {
          // First indexed parameter is the claim ID
          const claimIdHex = log.topics[1];
          return parseInt(claimIdHex, 16);
        }
      }
    } catch (error) {
      console.error('Error extracting claim ID:', error);
    }
    return null;
  }, []);

  // Generate claim link
  const generateClaimLink = useCallback((claimCode: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/claim/${claimCode}`;
  }, []);

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

    let claimCode: string = "";
    let isUnique = false;

    try {
      for (let i = 0; i < 5; i++) {
        claimCode = generateClaimCode();
        const data = await readContract(config, {
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'codeToClaimId',
          args: [claimCode]
        });

        if (Number(data) === 0 || data === 0n) {
          isUnique = true;
          break;
        }
      }

      if (!isUnique) {
        toast.error("Failed to generate unique claim code. Please try again.");
        return;
      }
    } catch (error) {
      toast.error("Failed to verify claim code uniqueness");
      console.error(error);
      return;
    }

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
      claimCode,
    };

    // Store in ref immediately
    persistentFormDataRef.current = formSnapshot;

    try {
      const { secretPlain: finalSecret, secretHash } = ensureSecret(formSnapshot);

      // Update snapshot with final secret
      formSnapshot.secretPlain = finalSecret;
      formSnapshot.secretHash = secretHash;
      persistentFormDataRef.current = formSnapshot;

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
            claimCode
          ],
          value: BigInt(formSnapshot.rawAmount),
        });
        toast.info("Creating native CELO claim. Please wait...");
        const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

        if (receipt.status === 'success') {
          toast.success("Claim creation successful!");
          setCreateTxHash(hash);
          setTxHash(hash);

          // Extract claim ID from receipt
          const extractedClaimId = extractClaimIdFromReceipt(receipt);
          if (extractedClaimId !== null) {
            setClaimId(extractedClaimId);
          }

          // Generate and set claim link
          const link = generateClaimLink(claimCode);
          setClaimLink(link);

          // Update form data snapshot for display
          setFormDataSnapshot(formSnapshot);

          // Reset form for next claim
          reset();
        }
      } else {
        const approvalResult = await handleApprove(formSnapshot);
        if (approvalResult) {
          hash = await createClaimAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "createClaimERC20",
            args: [
              formSnapshot.currentToken.address as `0x${string}`,
              BigInt(formSnapshot.rawAmount),
              BigInt(expiryTs),
              recipientAddr as `0x${string}`,
              secretHash as `0x${string}`,
              claimCode
            ],
          });
          toast.info("Creating ERC20 claim. Please wait...");
          const receipt = await waitForTransactionReceipt(config, { hash: hash as `0x${string}` });

          if (receipt.status === 'success') {
            toast.success("Claim ERC20 creation successful!");
            setCreateTxHash(hash);
            setTxHash(hash);

            // Extract claim ID from receipt
            const extractedClaimId = extractClaimIdFromReceipt(receipt);
            if (extractedClaimId !== null) {
              setClaimId(extractedClaimId);
            }

            // Generate and set claim link
            const link = generateClaimLink(claimCode);
            setClaimLink(link);

            // Update form data snapshot for display
            setFormDataSnapshot(formSnapshot);

            // Reset form for next claim
            reset();
          }
        }
      }
    } catch (error: any) {
      const message = error?.cause?.cause?.shortMessage || error?.message || 'Unknown error occurred';
      toast.error(`Failed to create claim: ${message}`);
      console.error('Claim creation error:', error);
    }
  }, [
    address,
    ensureSecret,
    currentToken,
    rawAmount,
    createClaimAsync,
    handleApprove,
    setCreateTxHash,
    setTxHash,
    setClaimId,
    extractClaimIdFromReceipt,
    generateClaimLink,
    getValues,
    reset,
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
  const isLoading = isSubmitting || isCreating || isApproving;

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
    <div className="container flex flex-col items-center justify-center py-12">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">
          Create <span className="gradient-text">Paylink</span>
        </h2>
        <p className="text-[var(--text-muted)]">
          Secure payment links on the Celo blockchain
        </p>
      </div>

      <div className="glass-card max-w-2xl">
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
                  : isCreating
                    ? "Creating Claim..."
                    : "Create Paylink"}
            </button>

            {txHash && (
              <a
                href={getExplorerTxUrl(chainId || 42220, txHash)}
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
    </div>
  );
}
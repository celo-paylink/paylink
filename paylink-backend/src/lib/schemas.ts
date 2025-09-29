import { z } from "zod";
import { isEIP4361Message } from "../utils/siwe";

export const createUserSchema = z.object({
  walletAddress: z
    .string({ message: "Wallet Address is required" })
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid wallet address format" }),
});

export const verifyUserSchema = createUserSchema.merge(
  z.object({
    signature: z
      .string({ message: "Signature is required" })
      .regex(/^0x[a-fA-F0-9]{130}$/, {
        message: "Invalid signature format (expected 0x + 65 bytes hex)",
      }),
    message: z
      .string({ message: "Message is required" })
      .min(10, { message: "Message is too short to be a sign-in message" })
      .refine(isEIP4361Message, {
        message: "Message must follow EIP-4361 (Sign-In with Ethereum) format",
      }),
  }),
);

export const createClaimSchema = z.object({
  claimId: z.number()
  .int("Must be an integer")
  .positive("Must be a positive number"),
  payerAddress: z
    .string({ message: "Payer Address is required" })
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid payer address format" }),
  token: z
    .string({ message: "Token Address is required" })
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid token address format" }),
  amount: z.string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number"),
  expiry: z.string()
    .datetime({ message: "Invalid date format. Use ISO 8601 format." })
    .refine(dateString => new Date(dateString) > new Date(), "Date must be in the future"),
  recipient: z
    .string({ message: "Token Address is required" })
    .regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid token address format" })
    .nullable()
    .optional(),
  secretHash: z.string()
    .regex(/^0x([A-Fa-f0-9]{64})$/, { message: "Invalid secretHash (expected bytes32 hex)" })
    .nullable()
    .optional(),
  txHashCreate: z.string().regex(/^0x([A-Fa-f0-9]{64})$/, { message: "Invalid tx hash" })
});



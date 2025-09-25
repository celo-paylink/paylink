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

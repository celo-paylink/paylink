import { ethers } from "ethers";
import * as queries from "../db/queries";
import { buildSiweMessage, generateNonce } from "../utils/siwe";
import { AppError } from "../error/errorHandler";
import { signJWT } from "../lib/jwt";
import prisma from "../lib/prisma";

const NONCE_TTL_MINUTES = 7;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const CHAIN_ID = Number(process.env.CHAIN_ID || 44787);

export const userNonce = async (data: { walletAddress: string }) => {
  const { walletAddress } = data;

  const addr = ethers.getAddress(walletAddress);
  const nonce = generateNonce(12);
  const expiresAt = new Date(Date.now() + NONCE_TTL_MINUTES * 60 * 1000);

  const values = {
    walletAddress: addr,
    nonce,
    nonceExpiresAt: expiresAt,
  };

  const _user = await queries.upsertUser(values);

  const message = buildSiweMessage({
    domain: new URL(API_BASE_URL).host,
    address: addr,
    statement: "Sign in to Paylink.",
    uri: ORIGIN,
    version: "1",
    chainId: CHAIN_ID,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(
      Date.now() + NONCE_TTL_MINUTES * 60 * 1000,
    ).toISOString(),
  });

  return { message, nonce };
};

export const userVerfication = async (data: {
  walletAddress: string;
  signature: string;
  message: string;
}) => {
  const { walletAddress, signature, message } = data;

  const addr = ethers.getAddress(walletAddress);
  const user = await queries.getUserByWalletAddress(addr);

  if (!user || !user.nonce || !user.nonceExpiresAt) {
    throw new AppError("Nonce not found; request a nonce first", 400);
  }

  const nowMs = Date.now();
  const expiryMs = new Date(user.nonceExpiresAt).getTime();
  if (nowMs > expiryMs) {
    throw new AppError("nonce expired; request a new nonce", 400);
  }

  if (!message.includes(user.nonce)) {
    throw new AppError("message does not contain expected nonce", 400);
  }

  let recovered: string;

  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (e) {
    console.error("verifyMessage error", e);
    throw new AppError("invalid signature format", 400);
  }

  if (ethers.getAddress(recovered) !== addr) {
    throw new AppError("signature does not match wallet address", 401);
  }

  const token = signJWT(user, 60 * 60 * 24);

  await prisma.user.update({
    where: { walletAddress: addr },
    data: { nonce: null, nonceExpiresAt: null },
  });

  return { token, user: { walletAddress: addr, id: user.id, name: user.name } };
};

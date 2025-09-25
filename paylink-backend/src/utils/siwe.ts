// src/utils/siwe.ts
import { randomBytes } from "crypto";
import dayjs from "dayjs";

export function generateNonce(length = 16) {
  return randomBytes(length).toString("hex");
}

export function buildSiweMessage(params: {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  chainId: number | string;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string | null;
  notBefore?: string | null;
  requestId?: string | null;
  resources?: string[] | null;
}) {
  const {
    domain,
    address,
    statement,
    uri,
    version = "1",
    chainId,
    nonce,
    issuedAt = dayjs().toISOString(),
    expirationTime,
    notBefore,
    requestId,
    resources,
  } = params;

  let s = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n`;

  if (statement) {
    s += `${statement}\n\n`;
  }

  s += `URI: ${uri}\nVERSION: ${version}\nCHAIN ID: ${chainId}\nNONCE: ${nonce}\nISSUED AT: ${issuedAt}`;

  if (expirationTime) s += `\nEXPIRATION TIME: ${expirationTime}`;
  if (notBefore) s += `\nNOT BEFORE: ${notBefore}`;
  if (requestId) s += `\nREQUEST ID: ${requestId}`;
  if (resources && resources.length > 0) {
    s += "\nRESOURCES:";
    for (const r of resources) {
      s += `\n- ${r}`;
    }
  }

  return s;
}

export function isEIP4361Message(msg: string) {
  if (!msg) return false;
  const normalized = msg.toLowerCase();
  // check for the typical human-readable request and the required labeled fields
  const hasSigninPhrase = normalized.includes(
    "wants you to sign in with your ethereum account",
  );
  const hasURI = normalized.includes("uri:");
  const hasVersion = normalized.includes("version:");
  const hasNonce = normalized.includes("nonce:");
  const hasIssuedAt = normalized.includes("issued at:");
  return Boolean(
    hasSigninPhrase && hasURI && hasVersion && hasNonce && hasIssuedAt,
  );
}

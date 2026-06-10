/**
 * Browser authorization tokens for table sessions.
 *
 * After staff confirms a device's first order, that device receives one raw
 * opaque token. Only the SHA-256 hash is ever stored
 * (table_session_access_tokens.token_hash); the raw token lives in the
 * customer's browser storage and is sent with subsequent order submissions.
 *
 * Pure + Web Crypto only, so it runs in node, edge and tests alike.
 */

const TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const SESSION_TOKEN_LENGTH = 48;

/** Default lifetime of a browser authorization (also ends when the session closes). */
export const SESSION_TOKEN_TTL_HOURS = 8;

/**
 * Generates a cryptographically random, URL-safe session authorization token.
 * 256 % 64 === 0, so masking with 63 introduces no modulo bias.
 */
export function generateSessionAccessToken(): string {
  const bytes = new Uint8Array(SESSION_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  let token = "";
  for (const byte of bytes) {
    token += TOKEN_ALPHABET[byte & 63];
  }
  return token;
}

/** Loose shape check before hitting the database with a client-sent token. */
export function isValidSessionTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,64}$/.test(token);
}

/** SHA-256 hash of a raw token, hex-encoded. Only hashes are persisted. */
export async function hashSessionToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

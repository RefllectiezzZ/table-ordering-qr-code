/**
 * Public QR token helpers.
 *
 * Tokens are the ONLY public identifier for a table. They must be
 * non-guessable: 32 characters drawn from a 64-character URL-safe alphabet
 * gives 192 bits of entropy.
 *
 * Pure + Web Crypto only, so it runs in node, edge and tests alike.
 */

const TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const TABLE_TOKEN_LENGTH = 32;

/**
 * Generates a cryptographically random, URL-safe table token.
 * 256 % 64 === 0, so masking with 63 introduces no modulo bias.
 */
export function generateTableToken(): string {
  const bytes = new Uint8Array(TABLE_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  let token = "";
  for (const byte of bytes) {
    token += TOKEN_ALPHABET[byte & 63];
  }
  return token;
}

/**
 * Loose shape check used before hitting the database with a token from the
 * URL. Accepts the generated 32-char format and the longer/shorter demo seed
 * tokens, while rejecting junk early.
 */
export function isValidPublicTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{10,64}$/.test(token);
}

/** Generates an idempotency token for public order submission (client side). */
export function generateClientOrderToken(): string {
  return crypto.randomUUID();
}

/**
 * Public platform metadata from environment variables.
 * Safe defaults when unset — never throws.
 */

export function getPlatformName(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_NAME?.trim() || "QR Menu";
}

export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.com";
}

export function getLegalEntityName(): string {
  return process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "Fornecedor da plataforma";
}

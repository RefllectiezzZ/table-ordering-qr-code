/**
 * Canonical base URL of the app, used wherever an absolute URL is required
 * (auth redirects, QR code targets).
 *
 * Why not request.url? Behind TLS-terminating proxies (and with some browser
 * HTTPS upgrades) the reconstructed request URL can claim "https://" even
 * when the app is served over plain http locally — that is exactly the bug
 * that sent sign-outs to https://localhost:3000. The configured
 * NEXT_PUBLIC_APP_URL is authoritative; the localhost fallback only exists
 * for local development when the variable is missing.
 *
 * Never derived from user input, so it cannot become an open redirect.
 */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    // Normalize: no trailing slash.
    return configured.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

/** Absolute URL for an app-internal path ("/login" -> "<base>/login"). */
export function absoluteAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalizedPath}`;
}

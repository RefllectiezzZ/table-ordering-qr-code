/**
 * Same-origin guard for private/authenticated mutation routes (CSRF defense
 * in depth on top of SameSite=Lax auth cookies).
 *
 * Policy:
 *  - Safe methods (GET/HEAD/OPTIONS) always pass.
 *  - If an Origin header is present it must be a valid http(s) URL whose host
 *    equals the request's own host.
 *  - Without an Origin header, Sec-Fetch-Site must be "same-origin",
 *    "same-site" or "none" (browser-initiated, non-cross-site).
 *  - If neither header is present the request is rejected: every modern
 *    browser sends at least one of them for cross-origin-capable requests,
 *    so the only legitimate callers without both are non-browser clients,
 *    which have no business calling cookie-authenticated mutation routes.
 *
 * Deliberately NOT applied to POST /api/public/orders (unauthenticated,
 * token-scoped, rate-limited instead).
 *
 * Pure header logic with no secrets, kept free of "server-only" so it can be
 * unit-tested; it is only ever imported from route handlers.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOWED_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

/** Host of the current request: prefer the Host header, fall back to the URL. */
function requestHost(request: Request): string | null {
  const hostHeader = request.headers.get("host");
  if (hostHeader) return hostHeader;
  try {
    return new URL(request.url).host;
  } catch {
    return null;
  }
}

export function isSafeSameOriginRequest(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const origin = request.headers.get("origin");
  if (origin) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      return false; // malformed or opaque ("null") Origin
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const host = requestHost(request);
    return host !== null && parsed.host === host;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) {
    return ALLOWED_FETCH_SITES.has(fetchSite.toLowerCase());
  }

  // Neither header present: reject for private mutation routes.
  return false;
}

/**
 * Route-handler helper: returns a 403 response to send back, or null when the
 * request is allowed. The error body intentionally reveals nothing about
 * hosts or configuration.
 *
 * Usage at the top of every private POST handler:
 *   const originError = requireSameOrigin(request);
 *   if (originError) return originError;
 */
export function requireSameOrigin(request: Request): Response | null {
  if (isSafeSameOriginRequest(request)) return null;
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

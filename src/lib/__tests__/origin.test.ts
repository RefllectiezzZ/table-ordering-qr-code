import { describe, expect, it } from "vitest";
import { isSafeSameOriginRequest, requireSameOrigin } from "@/lib/security/origin";

const APP_URL = "https://app.example.com/api/restaurant/categories/create";

/**
 * Note: the fetch spec treats "host" as a forbidden header, so the Request
 * constructor silently drops it; the guard then falls back to the request URL
 * host, which is what these tests exercise. In the real Next.js runtime the
 * Host header is present and takes precedence.
 */
function makeRequest(method: string, headers: Record<string, string> = {}): Request {
  return new Request(APP_URL, { method, headers });
}

describe("isSafeSameOriginRequest", () => {
  it("allows same-origin POST (Origin matches host)", () => {
    const request = makeRequest("POST", { origin: "https://app.example.com" });
    expect(isSafeSameOriginRequest(request)).toBe(true);
  });

  it("rejects cross-site Origin", () => {
    const request = makeRequest("POST", { origin: "https://evil.example.net" });
    expect(isSafeSameOriginRequest(request)).toBe(false);
  });

  it("rejects same host on a different port", () => {
    const request = makeRequest("POST", { origin: "https://app.example.com:8443" });
    expect(isSafeSameOriginRequest(request)).toBe(false);
  });

  it("rejects malformed and opaque Origin values", () => {
    for (const origin of ["null", "not a url", "javascript:alert(1)", "ftp://app.example.com"]) {
      const request = makeRequest("POST", { origin });
      expect(isSafeSameOriginRequest(request), `origin=${origin}`).toBe(false);
    }
  });

  it("allows safe methods regardless of headers", () => {
    expect(isSafeSameOriginRequest(makeRequest("GET"))).toBe(true);
    expect(isSafeSameOriginRequest(makeRequest("HEAD"))).toBe(true);
    expect(isSafeSameOriginRequest(makeRequest("OPTIONS"))).toBe(true);
    expect(
      isSafeSameOriginRequest(makeRequest("GET", { origin: "https://evil.example.net" })),
    ).toBe(true);
  });

  it("enforces for all unsafe methods", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isSafeSameOriginRequest(makeRequest(method)), method).toBe(false);
    }
  });

  it("falls back to Sec-Fetch-Site when Origin is absent", () => {
    expect(
      isSafeSameOriginRequest(makeRequest("POST", { "sec-fetch-site": "same-origin" })),
    ).toBe(true);
    expect(
      isSafeSameOriginRequest(makeRequest("POST", { "sec-fetch-site": "same-site" })),
    ).toBe(true);
    expect(isSafeSameOriginRequest(makeRequest("POST", { "sec-fetch-site": "none" }))).toBe(true);
    expect(
      isSafeSameOriginRequest(makeRequest("POST", { "sec-fetch-site": "cross-site" })),
    ).toBe(false);
  });

  it("prefers Origin over Sec-Fetch-Site when both are present", () => {
    const request = makeRequest("POST", {
      origin: "https://evil.example.net",
      "sec-fetch-site": "same-origin",
    });
    expect(isSafeSameOriginRequest(request)).toBe(false);
  });

  it("rejects unsafe requests with neither Origin nor Sec-Fetch-Site", () => {
    expect(isSafeSameOriginRequest(makeRequest("POST"))).toBe(false);
  });
});

describe("requireSameOrigin", () => {
  it("returns null for allowed requests", () => {
    const request = makeRequest("POST", { origin: "https://app.example.com" });
    expect(requireSameOrigin(request)).toBeNull();
  });

  it("returns a 403 JSON response without config details for rejected requests", async () => {
    const response = requireSameOrigin(makeRequest("POST", { origin: "https://evil.example.net" }));
    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
    const body = await response!.json();
    expect(body).toEqual({ error: "Forbidden" });
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { absoluteAppUrl, getAppBaseUrl } from "@/lib/app-url";

const ORIGINAL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL;
});

describe("getAppBaseUrl", () => {
  it("uses the configured NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    expect(getAppBaseUrl()).toBe("https://example.com");
  });

  it("strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    expect(getAppBaseUrl()).toBe("https://example.com");
  });

  it("falls back to plain-http localhost for local development", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });
});

describe("absoluteAppUrl", () => {
  it("joins paths against the base", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(absoluteAppUrl("/")).toBe("http://localhost:3000/");
    expect(absoluteAppUrl("/login")).toBe("http://localhost:3000/login");
    expect(absoluteAppUrl("login")).toBe("http://localhost:3000/login");
  });
});

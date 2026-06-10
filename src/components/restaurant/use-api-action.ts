"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Small client hook for calling the app's POST route handlers and refreshing
 * server-rendered data afterwards.
 */
export function useApiAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    url: string,
    body: unknown,
    options?: { onSuccess?: (payload: unknown) => void },
  ): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setError(payload.message ?? payload.error ?? "Something went wrong.");
        return false;
      }
      options?.onSuccess?.(payload);
      router.refresh();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error, setError };
}

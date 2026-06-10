"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Shown on /login when a session already exists: a short notice, then a
 * client-side redirect. The destination is computed SERVER-SIDE from the
 * profile role (/admin or /restaurant) — never from user-provided input, so
 * there is no open-redirect surface here.
 */
export function AlreadySignedIn({
  destination,
  message,
  linkLabel,
}: {
  destination: string;
  message: string;
  linkLabel: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => router.replace(destination), 1200);
    return () => clearTimeout(timeout);
  }, [destination, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <span
        aria-hidden
        className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"
      />
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <Link
        href={destination}
        className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

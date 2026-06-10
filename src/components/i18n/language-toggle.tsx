"use client";

import { useRouter } from "next/navigation";
import { APP_LANGUAGE_COOKIE, type AppLanguage } from "@/lib/i18n/app";
import { cn } from "@/lib/utils";

function persistLanguageCookie(lang: AppLanguage) {
  document.cookie = `${APP_LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * PT/EN switcher for the landing page, admin area and legal pages. Stores the
 * choice in a cookie (1 year) and refreshes the server-rendered page.
 */
export function LanguageToggle({
  current,
  variant = "light",
}: {
  current: AppLanguage;
  variant?: "light" | "dark";
}) {
  const router = useRouter();

  function setLanguage(lang: AppLanguage) {
    if (lang === current) return;
    persistLanguageCookie(lang);
    router.refresh();
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-xs font-semibold",
        variant === "dark" ? "border-slate-600" : "border-slate-200 bg-white",
      )}
      role="group"
      aria-label="Language"
    >
      {(["pt", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={current === lang}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            current === lang
              ? variant === "dark"
                ? "bg-white text-slate-900"
                : "bg-slate-900 text-white"
              : variant === "dark"
                ? "text-slate-300 hover:text-white"
                : "text-slate-500 hover:text-slate-900",
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

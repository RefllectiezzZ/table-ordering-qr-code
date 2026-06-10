import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { LEGAL_STRINGS, type AppLanguage } from "@/lib/i18n/app";

export function LegalPage({
  title,
  lang,
  children,
}: {
  title: string;
  lang: AppLanguage;
  children: ReactNode;
}) {
  const t = LEGAL_STRINGS[lang];

  return (
    <main className="flex-1 bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-sm font-bold text-slate-900">
            Table<span className="text-amber-600">Order</span>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="flex gap-4 text-xs text-slate-500">
              <Link href="/terms" className="hover:text-slate-900">
                {t.terms}
              </Link>
              <Link href="/privacy" className="hover:text-slate-900">
                {t.privacy}
              </Link>
              <Link href="/allergen-disclaimer" className="hover:text-slate-900">
                {t.allergens}
              </Link>
            </nav>
            <LanguageToggle current={lang} />
          </div>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mb-8 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          {t.draftNotice}
        </p>
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}

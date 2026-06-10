import Link from "next/link";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { Button } from "@/components/ui/button";
import { LANDING_STRINGS } from "@/lib/i18n/landing";
import { getAppLanguage } from "@/lib/i18n/server";
import { getSessionProfile } from "@/lib/security/guards";

// Reads the language cookie and the auth session, so it renders per-request.
export const dynamic = "force-dynamic";

const STEP_ICONS = ["📱", "🛒", "👨‍🍳"];
const FEATURE_ICONS = ["🎨", "✅", "📋", "🌍", "⚠️", "🕐"];
const TRUST_ICONS = ["🔒", "🧮", "🙈"];

export default async function LandingPage() {
  const lang = await getAppLanguage();
  const t = LANDING_STRINGS[lang];

  // Signed-in users get a direct path to their own area instead of a second
  // trip through /login. The destination comes from the server-side profile
  // role, never from anything client-provided.
  const session = await getSessionProfile();
  const dashboardHref = session
    ? session.profile.role === "platform_admin"
      ? "/admin"
      : "/restaurant"
    : null;

  return (
    <main className="flex-1 bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Table<span className="text-amber-600">Order</span>
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle current={lang} />
            {dashboardHref ? (
              <Link href={dashboardHref}>
                <Button size="sm">{t.navDashboard}</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">{t.navLogin}</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(245,158,11,0.12),transparent)]"
        />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="mb-5 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800">
            {t.heroBadge}
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {t.heroSubtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href={dashboardHref ?? "/login"}>
              <Button size="lg" className="shadow-lg shadow-slate-900/10">
                {dashboardHref ? t.ctaDashboard : t.ctaLogin}
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline">
                {t.ctaHowItWorks}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t.howTitle}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">{t.howSubtitle}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {t.howSteps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                    {STEP_ICONS[index]}
                  </span>
                  <span className="text-xs font-bold text-amber-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + visual mockup */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {t.benefitsTitle}
            </h2>
            <div className="mt-7 space-y-5">
              {t.benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
                  >
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{benefit.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CSS phone mockup of the public menu (fictional restaurant) */}
          <div className="flex flex-col items-center">
            <div className="w-64 rounded-[2rem] border-8 border-slate-900 bg-white shadow-2xl">
              <div className="rounded-t-[1.5rem] bg-gradient-to-br from-amber-600 to-orange-500 px-4 pb-6 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-extrabold text-amber-600">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Café Aurora</p>
                    <p className="text-[10px] font-semibold text-amber-100">Mesa 4</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 px-3 py-4">
                {[
                  { name: "Croissant misto", price: "3,50 €" },
                  { name: "Cappuccino", price: "2,20 €" },
                  { name: "Panqueca de frutos vermelhos", price: "6,50 €" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 shadow-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-[11px] font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] font-semibold text-amber-600">{item.price}</p>
                    </div>
                    <span className="rounded-lg bg-amber-600 px-2 py-1 text-[9px] font-bold text-white">
                      +
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2.5">
                  <span className="text-[10px] font-semibold text-slate-300">2 · Mesa 4</span>
                  <span className="text-[11px] font-bold text-white">5,70 €</span>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-slate-400">{t.mockupTagline}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t.featuresTitle}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span aria-hidden className="mb-3 block text-2xl">
                  {FEATURE_ICONS[index]}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / security */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {t.trustTitle}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {t.trustItems.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 p-6 text-center"
            >
              <span aria-hidden className="mb-3 block text-2xl">
                {TRUST_ICONS[index]}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-100 bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t.finalCtaTitle}
          </h2>
          <p className="mt-3 text-sm text-slate-300">{t.finalCtaSubtitle}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href={dashboardHref ?? "/login"}>
              <Button size="lg" className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                {dashboardHref ? t.ctaDashboard : t.ctaLogin}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>{t.footerTagline}</span>
          <nav className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-900">
              {t.footerTerms}
            </Link>
            <Link href="/privacy" className="hover:text-slate-900">
              {t.footerPrivacy}
            </Link>
            <Link href="/allergen-disclaimer" className="hover:text-slate-900">
              {t.footerAllergens}
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Branded QR menus",
    description:
      "Each restaurant gets its own colors, logo and welcome message on a mobile-first menu in PT, EN, ES and FR.",
  },
  {
    title: "Order from the table",
    description:
      "Customers scan the QR code on their table, browse the menu and send the order straight to the kitchen. No app, no account.",
  },
  {
    title: "Live kitchen board",
    description:
      "Staff see new orders instantly, grouped by status: new, preparing, ready, delivered.",
  },
  {
    title: "Translations via CSV",
    description:
      "Export the menu to CSV, translate it offline (or with your favourite AI), preview the changes and import safely.",
  },
  {
    title: "Allergen aware",
    description:
      "Products carry the 14 EU allergen codes, displayed in the customer's language with a clear staff-confirmation disclaimer.",
  },
  {
    title: "Multi-tenant by design",
    description:
      "Every restaurant's data is isolated with Postgres Row Level Security. One platform, many restaurants, zero crossover.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1 bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Table<span className="text-amber-600">Order</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/t/demo-mesa-1-k3v9q2x8w7z4"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              Demo menu
            </Link>
            <Link href="/login">
              <Button size="sm">Log in</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          QR table ordering for small restaurants
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Your menu on every table.
          <br />
          Orders straight to the kitchen.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Customers scan a QR code, see your branded multilingual menu and order without waiting.
          You manage everything from a simple dashboard — no hardware, no app installs, no online
          payments to set up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg">Restaurant login</Button>
          </Link>
          <Link href="/t/demo-mesa-1-k3v9q2x8w7z4">
            <Button size="lg" variant="outline">
              Try the demo QR menu
            </Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          The demo menu requires the local demo seed (see README).
        </p>
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-slate-500 sm:flex-row">
          <span>TableOrder — MVP preview. No online payments.</span>
          <nav className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/allergen-disclaimer" className="hover:text-slate-900">
              Allergen disclaimer
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

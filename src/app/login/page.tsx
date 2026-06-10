import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionProfile } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  // Already authenticated users go straight to their area.
  const session = await getSessionProfile();
  if (session) {
    redirect(session.profile.role === "platform_admin" ? "/admin" : "/restaurant");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-lg font-bold text-slate-900">
          Table<span className="text-amber-600">Order</span>
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Log in</h1>
          <p className="mb-6 text-sm text-slate-500">
            For restaurant teams and platform administrators.
          </p>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Customers don&apos;t need an account — just scan the QR code on your table.
        </p>
      </div>
    </main>
  );
}

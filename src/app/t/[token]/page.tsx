import type { Metadata } from "next";
import { PublicMenuClient } from "@/components/public-menu/public-menu-client";
import { resolvePublicMenu } from "@/server/public-menu";

// Tenant-scoped, token-resolved content: never statically cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu",
  robots: { index: false, follow: false },
};

/**
 * Public QR menu. The token is the only lookup key — table and restaurant are
 * derived from it server-side. Invalid tokens, inactive tables and suspended
 * restaurants render friendly, information-free error states.
 */
export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolution = await resolvePublicMenu(token);

  if (resolution.state === "invalid_token" || resolution.state === "table_inactive") {
    return (
      <PublicErrorState
        titlePt="QR code inválido"
        bodyPt="Este QR code não é válido ou já não está ativo. Peça ajuda à equipa do restaurante."
        bodyEn="This QR code is not valid or is no longer active. Please ask the restaurant staff for help."
      />
    );
  }

  if (resolution.state === "restaurant_unavailable") {
    return (
      <PublicErrorState
        titlePt="Menu indisponível"
        bodyPt="Este restaurante não está disponível de momento."
        bodyEn="This restaurant is currently unavailable."
      />
    );
  }

  return <PublicMenuClient data={resolution.data} />;
}

function PublicErrorState({
  titlePt,
  bodyPt,
  bodyEn,
}: {
  titlePt: string;
  bodyPt: string;
  bodyEn: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
          ⚠️
        </div>
        <h1 className="text-lg font-semibold text-slate-900">{titlePt}</h1>
        <p className="mt-2 text-sm text-slate-600">{bodyPt}</p>
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">{bodyEn}</p>
      </div>
    </main>
  );
}

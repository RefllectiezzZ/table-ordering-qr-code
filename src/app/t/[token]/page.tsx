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
        icon="🔍"
        titlePt="QR code inválido"
        bodyPt="Este QR code não é válido ou já não está ativo. Peça ajuda à equipa do restaurante."
        bodyEn="This QR code is not valid or is no longer active. Please ask the restaurant staff for help."
      />
    );
  }

  if (resolution.state === "restaurant_unavailable") {
    return (
      <PublicErrorState
        icon="🌙"
        titlePt="Menu indisponível"
        bodyPt="Este restaurante não está disponível de momento. Volte a tentar mais tarde ou fale com a equipa."
        bodyEn="This restaurant is currently unavailable. Please try again later or talk to the staff."
      />
    );
  }

  return <PublicMenuClient data={resolution.data} />;
}

function PublicErrorState({
  icon,
  titlePt,
  bodyPt,
  bodyEn,
}: {
  icon: string;
  titlePt: string;
  bodyPt: string;
  bodyEn: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
          {icon}
        </div>
        <h1 className="text-lg font-bold text-slate-900">{titlePt}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{bodyPt}</p>
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-400">
          {bodyEn}
        </p>
      </div>
    </main>
  );
}

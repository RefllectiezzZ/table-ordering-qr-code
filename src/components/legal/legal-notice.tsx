import { getLegalEntityName, getPlatformName, getSupportEmail } from "@/lib/platform-config";

export const LEGAL_DRAFT_NOTICE_PT =
  "Este texto é uma base operacional e deve ser revisto juridicamente antes de escala comercial.";

export function LegalDraftNotice() {
  return (
    <p className="mb-8 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
      {LEGAL_DRAFT_NOTICE_PT}
    </p>
  );
}

export function PlatformIntro() {
  const platform = getPlatformName();
  const entity = getLegalEntityName();
  return (
    <p>
      A plataforma <strong>{platform}</strong> ({entity}) fornece software de menu digital e fluxo
      de pedidos à mesa por QR code para restaurantes. Não processa pagamentos online nem emite
      documentos fiscais.
    </p>
  );
}

export function SupportEmailLink() {
  const email = getSupportEmail();
  return (
    <a href={`mailto:${email}`} className="text-sky-700 underline">
      {email}
    </a>
  );
}

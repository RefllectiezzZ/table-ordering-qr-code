import Link from "next/link";
import { LegalDraftNotice, SupportEmailLink } from "@/components/legal/legal-notice";
import { getPlatformName } from "@/lib/platform-config";

export const dynamic = "force-dynamic";

export const metadata = { title: "Suporte" };

export default function LegalSupportPage() {
  const platform = getPlatformName();

  return (
    <main className="flex-1 bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-sm font-bold text-slate-900">
            {platform}
          </Link>
          <nav className="flex gap-3 text-xs text-slate-500">
            <Link href="/legal/privacy" className="hover:text-slate-900">
              Privacidade
            </Link>
            <Link href="/legal/terms" className="hover:text-slate-900">
              Termos
            </Link>
            <Link href="/legal/data-processing" className="hover:text-slate-900">
              Tratamento de dados
            </Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Suporte</h1>
        <LegalDraftNotice />
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <section>
            <h2>Contacto</h2>
            <p>
              Email de suporte: <SupportEmailLink />
            </p>
          </section>
          <section>
            <h2>Em caso de urgência operacional</h2>
            <ul>
              <li>
                Pause os pedidos nas{" "}
                <Link href="/restaurant/settings" className="text-sky-700 underline">
                  definições do restaurante
                </Link>{" "}
                (requer sessão de dono/equipa).
              </li>
              <li>Continue o serviço pelo processo habitual do restaurante se a plataforma estiver indisponível.</li>
              <li>Quando a plataforma voltar, feche sessões de mesa manualmente se necessário.</li>
            </ul>
          </section>
          <section>
            <h2>Documentação operacional</h2>
            <p>
              Consulte os runbooks em{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">docs/operations/</code> no
              repositório do projeto (checklist de produção, backup/restauro, resposta a incidentes e
              playbook de suporte).
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

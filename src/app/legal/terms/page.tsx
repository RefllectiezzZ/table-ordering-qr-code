import Link from "next/link";
import { LegalDraftNotice, PlatformIntro } from "@/components/legal/legal-notice";
import { getPlatformName } from "@/lib/platform-config";

export const dynamic = "force-dynamic";

export const metadata = { title: "Termos de Utilização" };

export default function LegalTermsPage() {
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
            <Link href="/legal/data-processing" className="hover:text-slate-900">
              Tratamento de dados
            </Link>
            <Link href="/legal/support" className="hover:text-slate-900">
              Suporte
            </Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Termos de Utilização</h1>
        <LegalDraftNotice />
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <section>
            <h2>1. O serviço</h2>
            <PlatformIntro />
            <p className="mt-2">
              A plataforma fornece fluxo de menu digital e pedidos. A relação de consumo entre
              cliente e restaurante é sempre com o restaurante.
            </p>
          </section>
          <section>
            <h2>2. Responsabilidade do restaurante</h2>
            <p>Cada restaurante é responsável por:</p>
            <ul>
              <li>nomes e descrições dos produtos;</li>
              <li>preços e disponibilidade;</li>
              <li>informação de alergénios e ingredientes;</li>
              <li>traduções publicadas;</li>
              <li>preparação e serviço ao cliente;</li>
              <li>pagamento e obrigações fiscais/faturação.</li>
            </ul>
          </section>
          <section>
            <h2>3. Sem pagamentos nem faturação fiscal</h2>
            <p>
              A plataforma não processa pagamentos online, não emite faturas fiscais nem funciona
              como sistema de Point of Sale (POS). O pagamento e a fatura são tratados fora do
              sistema, pelos meios habituais do restaurante.
            </p>
          </section>
          <section>
            <h2>4. Confirmação de pedidos</h2>
            <p>
              O restaurante deve verificar pedidos antes de servir. O primeiro pedido de um
              dispositivo pode aguardar confirmação da equipa, conforme as definições de segurança
              da mesa.
            </p>
          </section>
          <section>
            <h2>5. Disponibilidade e limitações</h2>
            <p>
              O serviço pode estar indisponível por manutenção, falhas técnicas ou força maior. Não
              garantimos disponibilidade ininterrupta nesta fase de piloto.
            </p>
          </section>
          <section>
            <h2>6. Utilização aceitável</h2>
            <p>
              É proibido usar a plataforma para spam, pedidos falsos em massa ou qualquer abuso que
              prejudique o funcionamento do restaurante. Aplicamos medidas técnicas de prevenção de
              abuso nos pedidos públicos.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

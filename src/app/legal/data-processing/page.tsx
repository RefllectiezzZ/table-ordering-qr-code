import Link from "next/link";
import { LegalDraftNotice, PlatformIntro } from "@/components/legal/legal-notice";
import { getPlatformName } from "@/lib/platform-config";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tratamento de Dados" };

export default function LegalDataProcessingPage() {
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
            <Link href="/legal/support" className="hover:text-slate-900">
              Suporte
            </Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Acordo de Tratamento de Dados (base operacional)
        </h1>
        <LegalDraftNotice />
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <section>
            <h2>1. Papéis</h2>
            <ul>
              <li>
                O restaurante atua como responsável pelo tratamento dos dados do seu menu, pedidos e
                interação com clientes.
              </li>
              <li>
                O fornecedor da plataforma pode atuar como subcontratante (processador) dos dados
                operacionais necessários para prestar o serviço.
              </li>
            </ul>
          </section>
          <section>
            <h2>2. Objeto e duração</h2>
            <PlatformIntro />
            <p className="mt-2">
              O tratamento decorre da utilização do serviço e mantém-se enquanto durar a relação
              contratual ou operacional com o restaurante, salvo obrigações legais de conservação.
            </p>
          </section>
          <section>
            <h2>3. Categorias de dados</h2>
            <ul>
              <li>dados de conta de utilizadores do restaurante;</li>
              <li>dados do menu (produtos, preços, alergénios, traduções);</li>
              <li>dados de pedidos (mesa, itens, notas, estados, timestamps);</li>
              <li>registos técnicos de auditoria e anti-abuso (hashes, não IPs em claro).</li>
            </ul>
          </section>
          <section>
            <h2>4. Subcontratantes</h2>
            <p>
              Podem ser utilizados fornecedores de infraestrutura (alojamento, base de dados, email)
              como subcontratantes. A lista concreta deve ser confirmada antes de escala comercial.
            </p>
          </section>
          <section>
            <h2>5. Medidas de segurança</h2>
            <ul>
              <li>controlo de acesso por funções e Row Level Security na base de dados;</li>
              <li>validação server-side de pedidos públicos;</li>
              <li>chaves de serviço apenas no servidor;</li>
              <li>registos de auditoria para ações sensíveis.</li>
            </ul>
          </section>
          <section>
            <h2>6. Revisão antes de escala</h2>
            <p>
              Este documento é uma base operacional para piloto controlado. Deve ser revisto por
              assessoria jurídica antes de utilização comercial alargada.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

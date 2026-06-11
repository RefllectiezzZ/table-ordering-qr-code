import Link from "next/link";
import { LegalDraftNotice, PlatformIntro, SupportEmailLink } from "@/components/legal/legal-notice";
import { getPlatformName } from "@/lib/platform-config";

export const dynamic = "force-dynamic";

export const metadata = { title: "Política de Privacidade" };

export default function LegalPrivacyPage() {
  const platform = getPlatformName();

  return (
    <main className="flex-1 bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-sm font-bold text-slate-900">
            {platform}
          </Link>
          <nav className="flex gap-3 text-xs text-slate-500">
            <Link href="/legal/terms" className="hover:text-slate-900">
              Termos
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
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Política de Privacidade</h1>
        <LegalDraftNotice />
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          <section>
            <h2>1. O que faz a plataforma</h2>
            <PlatformIntro />
          </section>
          <section>
            <h2>2. Utilizadores do restaurante</h2>
            <p>Para donos e equipa de restaurante, tratamos dados como:</p>
            <ul>
              <li>nome e email do perfil de autenticação;</li>
              <li>papel (dono, equipa, administração da plataforma);</li>
              <li>associação ao restaurante;</li>
              <li>registos de auditoria de ações relevantes na plataforma.</li>
            </ul>
          </section>
          <section>
            <h2>3. Dados operacionais de pedidos</h2>
            <p>Quando clientes pedem pelo QR code, podemos tratar:</p>
            <ul>
              <li>mesa associada ao pedido;</li>
              <li>itens pedidos e quantidades;</li>
              <li>notas de texto escritas pelo cliente;</li>
              <li>datas, horas e estado do pedido.</li>
            </ul>
          </section>
          <section>
            <h2>4. Clientes públicos (sem conta)</h2>
            <p>
              Não é necessária conta para pedir. Podemos usar tokens de navegador/sessão para
              continuidade do carrinho e do fluxo de pedidos. Para prevenção de abuso, dados
              derivados do endereço IP podem ser transformados por função hash e guardados
              temporariamente — nunca guardamos o IP em texto simples.
            </p>
          </section>
          <section>
            <h2>5. Conservação</h2>
            <ul>
              <li>
                Pedidos operacionais: conservados conforme a política de limpeza administrada pela
                plataforma.
              </li>
              <li>Registos de auditoria: conservados para segurança e operações.</li>
            </ul>
          </section>
          <section>
            <h2>6. Subcontratantes e infraestrutura</h2>
            <p>
              Fornecedores de alojamento, base de dados e email podem tratar dados enquanto
              infraestrutura técnica. O alojamento da aplicação e a base de dados podem ser
              providenciados por serviços como Vercel e Supabase, respetivamente, quando
              configurados para produção.
            </p>
          </section>
          <section>
            <h2>7. Cookies e armazenamento local</h2>
            <p>
              Utilizamos armazenamento local/sessão do navegador para continuidade do carrinho,
              pedidos e preferências da interface (por exemplo, som de novos pedidos no painel da
              equipa).
            </p>
          </section>
          <section>
            <h2>8. Direitos e contacto</h2>
            <p>
              Para questões sobre privacidade, contacte <SupportEmailLink />. Não vendemos dados
              pessoais.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

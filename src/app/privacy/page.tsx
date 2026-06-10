import { LegalPage } from "@/components/legal/legal-page";
import { getAppLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Política de Privacidade / Privacy Policy" };

export default async function PrivacyPage() {
  const lang = await getAppLanguage();

  if (lang === "pt") {
    return (
      <LegalPage title="Política de Privacidade (rascunho)" lang={lang}>
        <PrivacyPt />
      </LegalPage>
    );
  }
  return (
    <LegalPage title="Privacy Policy (draft)" lang={lang}>
      <PrivacyEn />
    </LegalPage>
  );
}

function PrivacyPt() {
  return (
    <>
      <section>
        <h2>1. Quem somos</h2>
        <p>
          O TableOrder fornece software de pedidos à mesa por QR code para restaurantes. Este
          rascunho descreve os dados que tratamos em relação a clientes dos restaurantes,
          utilizadores de restaurante e administradores da plataforma, numa fase de MVP dirigida
          a restaurantes em Portugal e na União Europeia.
        </p>
      </section>
      <section>
        <h2>2. Clientes (sem conta)</h2>
        <p>
          Quem pede pelo QR code não cria conta e não tem de indicar nome, telefone ou email.
          Quando um cliente envia um pedido, guardamos:
        </p>
        <ul>
          <li>a mesa a que o pedido pertence (através do token do QR);</li>
          <li>os itens pedidos e as quantidades;</li>
          <li>notas de texto livre escritas pelo cliente, se existirem;</li>
          <li>tokens técnicos aleatórios usados para evitar pedidos duplicados e para autorizar pedidos seguintes do mesmo navegador durante a mesma sessão de mesa;</li>
          <li>datas, horas e o estado do pedido.</li>
        </ul>
        <p>
          Pedimos aos clientes que não escrevam dados pessoais (nomes, telefones, informação de
          saúde) nas notas dos pedidos. As notas servem apenas para instruções de preparação.
        </p>
      </section>
      <section>
        <h2>3. Utilizadores de restaurante</h2>
        <p>
          Os responsáveis e a equipa de cada restaurante têm conta com email, nome opcional, um
          perfil de acesso e o restaurante a que pertencem. A autenticação é feita pelo Supabase
          Auth; as palavras-passe são guardadas apenas pelo Supabase, em formato cifrado.
        </p>
      </section>
      <section>
        <h2>4. Fornecedores</h2>
        <ul>
          <li>Supabase: base de dados, autenticação e armazenamento de imagens dos produtos;</li>
          <li>Vercel: alojamento da aplicação (planeado para produção);</li>
          <li>Cloudflare: DNS e CDN (planeado para produção).</li>
        </ul>
      </section>
      <section>
        <h2>5. Conservação de dados (valores de trabalho, a confirmar)</h2>
        <ul>
          <li>Pedidos e itens: histórico operacional; objetivo de 12 meses, seguido de eliminação ou anonimização.</li>
          <li>Registos de auditoria: 12 meses.</li>
          <li>Contas de utilizadores de restaurante: enquanto durar a relação com o restaurante.</li>
          <li>Lotes de importação CSV: 90 dias.</li>
          <li>Autorizações de navegador de sessões de mesa: expiram em horas e são revogadas quando a sessão fecha.</li>
        </ul>
        <p>Estes prazos têm de ser confirmados antes do lançamento pago.</p>
      </section>
      <section>
        <h2>6. Os seus direitos</h2>
        <p>
          Consoante a sua jurisdição, incluindo o RGPD na União Europeia, pode ter direitos de
          acesso, retificação e apagamento. Os pedidos podem ser dirigidos ao operador da
          plataforma; os contactos serão publicados antes do lançamento comercial. Este documento
          não constitui uma declaração de conformidade plena com o RGPD; a revisão de
          conformidade está prevista para antes do lançamento pago.
        </p>
      </section>
      <section>
        <h2>7. Segurança</h2>
        <p>
          Os dados de cada restaurante estão isolados através de Row Level Security no Postgres.
          As credenciais administrativas estão limitadas a uso no servidor. Esta versão não
          processa dados de cartões de pagamento.
        </p>
      </section>
      <section>
        <h2>8. Estado deste documento</h2>
        <p>
          Este texto é um rascunho para a fase de MVP. Não é aconselhamento jurídico e tem de ser
          revisto por um profissional qualificado antes da utilização em produção.
        </p>
      </section>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <section>
        <h2>1. Who we are</h2>
        <p>
          TableOrder provides QR table-ordering software for restaurants. This draft describes
          the data we handle for restaurant customers, restaurant users and platform
          administrators, during an MVP phase aimed at restaurants in Portugal and the European
          Union.
        </p>
      </section>
      <section>
        <h2>2. Customers (no account)</h2>
        <p>
          People ordering through a QR code do not create accounts and are not asked for a name,
          phone number or email. When a customer submits an order we store:
        </p>
        <ul>
          <li>the table the order belongs to (through the QR token);</li>
          <li>the ordered items and quantities;</li>
          <li>optional free-text notes written by the customer;</li>
          <li>random technical tokens used to avoid duplicate submissions and to authorize follow-up orders from the same browser during the same table session;</li>
          <li>timestamps and order status.</li>
        </ul>
        <p>
          We ask customers not to write personal data (names, phone numbers, health details) in
          order notes. Notes exist for preparation instructions only.
        </p>
      </section>
      <section>
        <h2>3. Restaurant users</h2>
        <p>
          Restaurant owners and staff have accounts with an email address, an optional name, an
          access role and the restaurant they belong to. Authentication is handled by Supabase
          Auth; passwords are stored only by Supabase, in hashed form.
        </p>
      </section>
      <section>
        <h2>4. Service providers</h2>
        <ul>
          <li>Supabase: database, authentication and product image storage;</li>
          <li>Vercel: application hosting (planned for production);</li>
          <li>Cloudflare: DNS and CDN (planned for production).</li>
        </ul>
      </section>
      <section>
        <h2>5. Data retention (working defaults, to be confirmed)</h2>
        <ul>
          <li>Orders and order items: operational history; 12-month target, then deletion or anonymisation.</li>
          <li>Audit logs: 12 months.</li>
          <li>Restaurant user accounts: for as long as the relationship with the restaurant lasts.</li>
          <li>CSV import batches: 90 days.</li>
          <li>Table-session browser authorizations: expire within hours and are revoked when the session closes.</li>
        </ul>
        <p>These periods must be confirmed before any paid launch.</p>
      </section>
      <section>
        <h2>6. Your rights</h2>
        <p>
          Depending on your jurisdiction, including the GDPR in the European Union, you may have
          rights of access, rectification and erasure. Requests can be addressed to the platform
          operator; contact details will be published before commercial launch. This document is
          not a statement of full GDPR compliance; a compliance review is planned before any paid
          launch.
        </p>
      </section>
      <section>
        <h2>7. Security</h2>
        <p>
          Each restaurant&apos;s data is isolated using Postgres Row Level Security.
          Administrative credentials are restricted to server-side use. This version does not
          process payment card data.
        </p>
      </section>
      <section>
        <h2>8. Status of this document</h2>
        <p>
          This text is a draft for the MVP phase. It is not legal advice and must be reviewed by
          a qualified professional before production use.
        </p>
      </section>
    </>
  );
}

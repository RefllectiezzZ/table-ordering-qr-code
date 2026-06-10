import { LegalPage } from "@/components/legal/legal-page";
import { getAppLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Termos de Utilização / Terms of Service" };

export default async function TermsPage() {
  const lang = await getAppLanguage();

  if (lang === "pt") {
    return (
      <LegalPage title="Termos de Utilização (rascunho)" lang={lang}>
        <TermsPt />
      </LegalPage>
    );
  }
  return (
    <LegalPage title="Terms of Service (draft)" lang={lang}>
      <TermsEn />
    </LegalPage>
  );
}

function TermsPt() {
  return (
    <>
      <section>
        <h2>1. O serviço</h2>
        <p>
          O TableOrder é um software que permite a restaurantes publicar um menu digital
          acessível por QR code e receber pedidos feitos pelos clientes à mesa. Somos um
          fornecedor de tecnologia: mostramos menus e transmitimos pedidos entre clientes e
          restaurantes. A relação de consumo acontece sempre entre o cliente e o restaurante.
        </p>
      </section>
      <section>
        <h2>2. Responsabilidade do restaurante</h2>
        <p>Cada restaurante que usa o serviço é o único responsável por:</p>
        <ul>
          <li>manter o menu correto, incluindo nomes e descrições dos produtos;</li>
          <li>definir e atualizar os preços;</li>
          <li>indicar a disponibilidade real dos produtos;</li>
          <li>validar a informação de ingredientes e alérgenos;</li>
          <li>rever as traduções que decide publicar;</li>
          <li>preparar e entregar os pedidos que aceita.</li>
        </ul>
      </section>
      <section>
        <h2>3. Sem pagamentos online</h2>
        <p>
          Esta versão não processa pagamentos online. Os pagamentos são acertados diretamente
          entre o cliente e o restaurante, no próprio restaurante, pelos meios que este aceitar.
        </p>
      </section>
      <section>
        <h2>4. Utilização pelos clientes</h2>
        <p>
          Os clientes não precisam de conta. Ao enviar um pedido através do QR code da mesa, o
          cliente está a pedir ao restaurante que prepare os itens escolhidos para aquela mesa. O
          pedido é uma solicitação: o restaurante pode confirmá-lo, recusá-lo ou cancelá-lo, por
          exemplo quando um produto esgota ou quando não consegue confirmar quem está sentado à
          mesa. O primeiro pedido de cada dispositivo pode ficar a aguardar confirmação da equipa
          antes de seguir para a cozinha.
        </p>
      </section>
      <section>
        <h2>5. Alérgenos</h2>
        <p>
          A informação de alérgenos apresentada nos menus é fornecida e validada por cada
          restaurante, não por nós. Quem tem alergias ou intolerâncias alimentares deve sempre
          confirmar diretamente com a equipa do restaurante antes de consumir. Veja o{" "}
          <a href="/allergen-disclaimer" className="text-sky-700 underline">
            aviso sobre alérgenos
          </a>
          .
        </p>
      </section>
      <section>
        <h2>6. Traduções</h2>
        <p>
          As traduções do menu podem ser feitas manualmente ou com apoio de ferramentas externas,
          através de um fluxo de exportação e importação em CSV. Cabe ao restaurante rever e
          aprovar as traduções antes de as publicar. Não respondemos por erros de tradução em
          conteúdos publicados pelo restaurante.
        </p>
      </section>
      <section>
        <h2>7. Utilização aceitável</h2>
        <p>
          As contas de restaurante devem manter as credenciais confidenciais e apenas aceder aos
          dados do próprio restaurante. É proibido tentar aceder a dados de outros restaurantes,
          abusar dos endpoints públicos, enviar pedidos falsos ou perturbar o funcionamento do
          serviço. O incumprimento pode levar à suspensão da conta ou do restaurante.
        </p>
      </section>
      <section>
        <h2>8. Suspensão e cessação</h2>
        <p>
          Podemos suspender um restaurante em caso de violação destes termos. Enquanto estiver
          suspenso, o menu público e a receção de pedidos ficam indisponíveis.
        </p>
      </section>
      <section>
        <h2>9. Responsabilidade</h2>
        <p>
          Durante esta fase de MVP, o serviço é disponibilizado tal como está, sem garantia de
          disponibilidade ininterrupta. Na medida máxima permitida por lei, não somos parte na
          venda entre o restaurante e o cliente nem respondemos por ela.
        </p>
      </section>
      <section>
        <h2>10. Alterações</h2>
        <p>
          Estes termos são um rascunho de trabalho. Serão finalizados, versionados e datados
          antes do lançamento comercial, e as alterações relevantes serão comunicadas aos
          restaurantes.
        </p>
      </section>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <section>
        <h2>1. The service</h2>
        <p>
          TableOrder is software that lets restaurants publish a digital menu reachable through a
          QR code and receive orders placed by customers at their tables. We are a technology
          provider: we display menus and transmit orders between customers and restaurants. The
          consumer relationship is always between the customer and the restaurant.
        </p>
      </section>
      <section>
        <h2>2. Restaurant responsibility</h2>
        <p>Each restaurant using the service is solely responsible for:</p>
        <ul>
          <li>keeping the menu accurate, including product names and descriptions;</li>
          <li>setting and updating prices;</li>
          <li>reflecting real product availability;</li>
          <li>validating ingredient and allergen information;</li>
          <li>reviewing the translations it decides to publish;</li>
          <li>preparing and delivering the orders it accepts.</li>
        </ul>
      </section>
      <section>
        <h2>3. No online payments</h2>
        <p>
          This version does not process online payments. Payments are settled directly between
          the customer and the restaurant, at the restaurant, using whatever means the restaurant
          accepts.
        </p>
      </section>
      <section>
        <h2>4. Customer use</h2>
        <p>
          Customers do not need an account. By sending an order through a table QR code, the
          customer asks the restaurant to prepare the selected items for that table. An order is
          a request: the restaurant may confirm, decline or cancel it, for instance when a
          product runs out or when it cannot verify who is sitting at the table. The first order
          from a device may wait for staff confirmation before reaching the kitchen.
        </p>
      </section>
      <section>
        <h2>5. Allergens</h2>
        <p>
          Allergen information shown on menus is provided and validated by each restaurant, not
          by us. Anyone with food allergies or intolerances should always check directly with the
          restaurant staff before consuming. See the{" "}
          <a href="/allergen-disclaimer" className="text-sky-700 underline">
            allergen notice
          </a>
          .
        </p>
      </section>
      <section>
        <h2>6. Translations</h2>
        <p>
          Menu translations may be prepared manually or with the help of external tools, through
          a CSV export and import flow. The restaurant is responsible for reviewing and approving
          translations before publishing them. We are not liable for translation errors in
          content published by the restaurant.
        </p>
      </section>
      <section>
        <h2>7. Acceptable use</h2>
        <p>
          Restaurant accounts must keep their credentials confidential and only access data
          belonging to their own restaurant. Attempting to reach other restaurants&apos; data,
          abusing public endpoints, submitting fake orders or disrupting the service is
          prohibited and may lead to suspension.
        </p>
      </section>
      <section>
        <h2>8. Suspension and termination</h2>
        <p>
          We may suspend a restaurant that breaches these terms. While suspended, its public menu
          and order intake are unavailable.
        </p>
      </section>
      <section>
        <h2>9. Liability</h2>
        <p>
          During this MVP phase the service is provided as is, with no promise of uninterrupted
          availability. To the maximum extent allowed by law, we are not a party to the sale
          between restaurant and customer and accept no liability for it.
        </p>
      </section>
      <section>
        <h2>10. Changes</h2>
        <p>
          These terms are a working draft. They will be finalised, versioned and dated before
          commercial launch, and relevant changes will be communicated to restaurants.
        </p>
      </section>
    </>
  );
}

import type { AppLanguage } from "@/lib/i18n/app";

/** Landing page copy, written to read naturally in both languages. */

export interface LandingStrings {
  navDemo: string;
  navLogin: string;
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  ctaLogin: string;
  ctaDemo: string;
  demoNote: string;
  howTitle: string;
  howSubtitle: string;
  howSteps: { title: string; description: string }[];
  benefitsTitle: string;
  benefits: { title: string; description: string }[];
  featuresTitle: string;
  features: { title: string; description: string }[];
  mockupTagline: string;
  trustTitle: string;
  trustItems: { title: string; description: string }[];
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  footerTagline: string;
  footerTerms: string;
  footerPrivacy: string;
  footerAllergens: string;
}

export const LANDING_STRINGS: Record<AppLanguage, LandingStrings> = {
  pt: {
    navDemo: "Menu de demonstração",
    navLogin: "Entrar",
    heroBadge: "Pedidos à mesa por QR code",
    heroTitle1: "O seu menu em cada mesa.",
    heroTitle2: "Os pedidos direto na cozinha.",
    heroSubtitle:
      "Menu QR, pedidos à mesa e painel de cozinha para restaurantes. Os clientes leem o QR code, escolhem no menu com a sua marca e pedem sem esperar. Sem aplicações, sem hardware, sem pagamentos online para configurar.",
    ctaLogin: "Entrar",
    ctaDemo: "Ver demonstração",
    demoNote: "A demonstração usa os dados de exemplo locais (ver README).",
    howTitle: "Como funciona",
    howSubtitle: "Três passos entre a mesa e a cozinha.",
    howSteps: [
      {
        title: "O cliente lê o QR",
        description:
          "Cada mesa tem um QR code fixo e impresso. O cliente abre o menu no telemóvel, no idioma que preferir.",
      },
      {
        title: "Escolhe e envia o pedido",
        description:
          "Adiciona produtos ao carrinho, escreve notas se quiser e envia. O primeiro pedido de cada grupo é confirmado pela equipa para evitar abusos.",
      },
      {
        title: "A cozinha prepara",
        description:
          "O pedido aparece no painel da cozinha com mesa e número. A equipa acompanha cada estado até à entrega.",
      },
    ],
    benefitsTitle: "Para o seu restaurante",
    benefits: [
      {
        title: "Menos idas à mesa",
        description:
          "A equipa deixa de anotar pedidos à mão e concentra-se em servir. Os pedidos chegam organizados e legíveis.",
      },
      {
        title: "Menu sempre atualizado",
        description:
          "Mudou um preço ou esgotou um prato? Atualiza no painel e o menu público reflete a alteração de imediato.",
      },
      {
        title: "Sessões por mesa",
        description:
          "Quando os clientes saem, a equipa fecha a sessão da mesa. Os pedidos antigos não se misturam com os clientes seguintes.",
      },
    ],
    featuresTitle: "Tudo o que está incluído",
    features: [
      {
        title: "Menus com a sua marca",
        description:
          "Cores, logótipo e mensagem de boas-vindas próprios, num menu pensado para telemóvel em PT, EN, ES e FR.",
      },
      {
        title: "Confirmação do primeiro pedido",
        description:
          "Pedidos de links guardados ficam pendentes até a equipa confirmar a mesa. Depois disso, o mesmo telemóvel pede sem fricção.",
      },
      {
        title: "Painel de cozinha em direto",
        description:
          "Pedidos por estado: novo, em preparação, pronto, entregue. Com número curto, mesa bem visível e tempos relativos.",
      },
      {
        title: "Traduções por CSV",
        description:
          "Exporte o menu num único CSV multi-idioma, traduza fora da aplicação, pré-visualize e importe com confirmação.",
      },
      {
        title: "Alérgenos da UE",
        description:
          "Os produtos usam os 14 códigos de alérgenos da UE, mostrados no idioma do cliente com aviso para confirmar com a equipa.",
      },
      {
        title: "Pausar pedidos",
        description:
          "Cozinha cheia ou fim de serviço? Pause os pedidos num clique. O menu continua visível para os clientes.",
      },
    ],
    mockupTagline: "Menu público, carrinho e estado do pedido num só ecrã.",
    trustTitle: "Segurança e isolamento de dados",
    trustItems: [
      {
        title: "Cada restaurante isolado",
        description:
          "Os dados de cada restaurante estão isolados com Row Level Security no Postgres. Um restaurante nunca vê os dados de outro.",
      },
      {
        title: "Preços calculados no servidor",
        description:
          "Os preços dos pedidos vêm sempre da base de dados. Nada do que o cliente envia altera valores.",
      },
      {
        title: "Sem contas para clientes",
        description:
          "Os clientes não criam conta nem dão dados pessoais. Só a equipa do restaurante tem acesso autenticado.",
      },
    ],
    finalCtaTitle: "Pronto para experimentar?",
    finalCtaSubtitle:
      "Entre com a conta do seu restaurante ou explore o menu de demonstração.",
    footerTagline: "TableOrder. Versão MVP, sem pagamentos online.",
    footerTerms: "Termos",
    footerPrivacy: "Privacidade",
    footerAllergens: "Alérgenos",
  },
  en: {
    navDemo: "Demo menu",
    navLogin: "Log in",
    heroBadge: "QR table ordering",
    heroTitle1: "Your menu on every table.",
    heroTitle2: "Orders straight to the kitchen.",
    heroSubtitle:
      "QR menus, table ordering and a kitchen board for restaurants. Customers scan the QR code, browse your branded menu and order without waiting. No apps, no hardware, no online payments to set up.",
    ctaLogin: "Log in",
    ctaDemo: "See the demo",
    demoNote: "The demo uses the local sample data (see README).",
    howTitle: "How it works",
    howSubtitle: "Three steps between the table and the kitchen.",
    howSteps: [
      {
        title: "The customer scans the QR",
        description:
          "Every table has a fixed, printed QR code. The customer opens the menu on their phone in the language they prefer.",
      },
      {
        title: "Picks and sends the order",
        description:
          "They add products to the cart, write notes if needed and submit. The first order of each group is confirmed by staff to prevent abuse.",
      },
      {
        title: "The kitchen prepares",
        description:
          "The order shows up on the kitchen board with table and number. Staff move it through each stage until delivery.",
      },
    ],
    benefitsTitle: "For your restaurant",
    benefits: [
      {
        title: "Fewer trips to the table",
        description:
          "Staff stop writing orders by hand and focus on service. Orders arrive organized and readable.",
      },
      {
        title: "A menu that is always current",
        description:
          "Changed a price or ran out of a dish? Update the dashboard and the public menu reflects it immediately.",
      },
      {
        title: "Per-table sessions",
        description:
          "When customers leave, staff close the table session. Old orders never mix with the next group.",
      },
    ],
    featuresTitle: "Everything included",
    features: [
      {
        title: "Menus with your brand",
        description:
          "Your colors, logo and welcome message on a mobile-first menu in PT, EN, ES and FR.",
      },
      {
        title: "First-order confirmation",
        description:
          "Orders from saved links stay pending until staff confirm the table. After that, the same phone orders without friction.",
      },
      {
        title: "Live kitchen board",
        description:
          "Orders by status: new, preparing, ready, delivered. With a short number, a clearly visible table and relative times.",
      },
      {
        title: "Translations via CSV",
        description:
          "Export the menu as a single multi-language CSV, translate it outside the app, preview and import with confirmation.",
      },
      {
        title: "EU allergens",
        description:
          "Products carry the 14 EU allergen codes, shown in the customer's language with a clear staff-confirmation notice.",
      },
      {
        title: "Pause ordering",
        description:
          "Kitchen slammed or closing time? Pause ordering in one click. The menu stays visible to customers.",
      },
    ],
    mockupTagline: "Public menu, cart and order status in one screen.",
    trustTitle: "Security and data isolation",
    trustItems: [
      {
        title: "Each restaurant isolated",
        description:
          "Every restaurant's data is isolated with Postgres Row Level Security. One restaurant never sees another's data.",
      },
      {
        title: "Prices computed server-side",
        description:
          "Order prices always come from the database. Nothing the customer sends can change amounts.",
      },
      {
        title: "No customer accounts",
        description:
          "Customers never create accounts or hand over personal data. Only restaurant staff have authenticated access.",
      },
    ],
    finalCtaTitle: "Ready to try it?",
    finalCtaSubtitle: "Log in with your restaurant account or explore the demo menu.",
    footerTagline: "TableOrder. MVP release, no online payments.",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
    footerAllergens: "Allergens",
  },
};

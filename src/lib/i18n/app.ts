/**
 * Lightweight PT/EN dictionary for the SaaS-facing surfaces: landing page,
 * admin area and legal pages. Portuguese is the default. The public QR menu
 * keeps its own PT/EN/ES/FR strings (public-menu.ts).
 */

export const APP_LANGUAGES = ["pt", "en"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const APP_LANGUAGE_COOKIE = "app_lang";
export const DEFAULT_APP_LANGUAGE: AppLanguage = "pt";

export function isAppLanguage(value: string | undefined | null): value is AppLanguage {
  return value === "pt" || value === "en";
}

export interface AdminStrings {
  overview: string;
  restaurants: string;
  users: string;
  signOut: string;
  platformAdmin: string;
  overviewTitle: string;
  overviewSubtitle: string;
  restaurantsTitle: string;
  restaurantsSubtitle: string;
  totalRestaurants: string;
  activeRestaurants: string;
  suspendedRestaurants: string;
  ordersLast24h: string;
  manageRestaurants: string;
  usersTitle: string;
  usersSubtitle: string;
  user: string;
  role: string;
  restaurant: string;
  created: string;
  status: string;
  active: string;
  suspended: string;
  draft: string;
}

export const ADMIN_STRINGS: Record<AppLanguage, AdminStrings> = {
  pt: {
    overview: "Visão geral",
    restaurants: "Restaurantes",
    users: "Utilizadores",
    signOut: "Sair",
    platformAdmin: "Administração da plataforma",
    overviewTitle: "Visão geral da plataforma",
    overviewSubtitle: "Vista global para suporte e administração.",
    restaurantsTitle: "Restaurantes",
    restaurantsSubtitle:
      "Crie restaurantes, abra a página de detalhe e controle o estado. Os novos restaurantes começam como rascunho; o menu público só funciona depois de ativados.",
    totalRestaurants: "Restaurantes",
    activeRestaurants: "Restaurantes ativos",
    suspendedRestaurants: "Restaurantes suspensos",
    ordersLast24h: "Pedidos (últimas 24 h)",
    manageRestaurants: "Gerir restaurantes →",
    usersTitle: "Utilizadores",
    usersSubtitle:
      "Todos os perfis da aplicação. Os utilizadores de restaurante são criados na página de cada restaurante. Os administradores da plataforma são criados manualmente (ver docs/testing/smoke-test.md).",
    user: "Utilizador",
    role: "Perfil",
    restaurant: "Restaurante",
    created: "Criado",
    status: "Estado",
    active: "Ativo",
    suspended: "Suspenso",
    draft: "Rascunho",
  },
  en: {
    overview: "Overview",
    restaurants: "Restaurants",
    users: "Users",
    signOut: "Sign out",
    platformAdmin: "Platform admin",
    overviewTitle: "Platform overview",
    overviewSubtitle: "Cross-tenant view for support and administration.",
    restaurantsTitle: "Restaurants",
    restaurantsSubtitle:
      "Create restaurants, open their detail page and control their status. New restaurants start as drafts; their public menu only works once activated.",
    totalRestaurants: "Total restaurants",
    activeRestaurants: "Active restaurants",
    suspendedRestaurants: "Suspended restaurants",
    ordersLast24h: "Orders (last 24h)",
    manageRestaurants: "Manage restaurants →",
    usersTitle: "Users",
    usersSubtitle:
      "All application profiles. Restaurant users are created from each restaurant's detail page. Platform admins are provisioned manually (see docs/testing/smoke-test.md).",
    user: "User",
    role: "Role",
    restaurant: "Restaurant",
    created: "Created",
    status: "Status",
    active: "Active",
    suspended: "Suspended",
    draft: "Draft",
  },
};

export interface LegalStrings {
  terms: string;
  privacy: string;
  allergens: string;
  draftNotice: string;
  backToSite: string;
}

export const LEGAL_STRINGS: Record<AppLanguage, LegalStrings> = {
  pt: {
    terms: "Termos",
    privacy: "Privacidade",
    allergens: "Alérgenos",
    draftNotice:
      "Documento em rascunho, sem valor de aconselhamento jurídico. Tem de ser revisto por um profissional qualificado antes do lançamento comercial. Última atualização: junho de 2026.",
    backToSite: "Voltar ao site",
  },
  en: {
    terms: "Terms",
    privacy: "Privacy",
    allergens: "Allergens",
    draftNotice:
      "Draft document, not legal advice. It must be reviewed by a qualified professional before commercial launch. Last updated: June 2026.",
    backToSite: "Back to the site",
  },
};

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
  // Restaurant list filters & metadata
  filterAll: string;
  name: string;
  slug: string;
  orders: string;
  hoursToday: string;
  actions: string;
  acceptingOrders: string;
  ordersPaused: string;
  openToday: string;
  closedToday: string;
  hoursNotConfigured: string;
  emptyFilterTitle: string;
  emptyFilterDescription: string;
  activate: string;
  suspend: string;
  details: string;
  // Restaurant detail sub-pages
  backToRestaurant: string;
  translationsTitle: string;
  translationsSubtitle: string;
  brandingTitle: string;
  brandingSubtitle: string;
  previewPublicMenu: string;
  createTableFirst: string;
  restaurantBrandingNote: string;
  saveBranding: string;
  saving: string;
  saved: string;
  templatePreset: string;
  templateIntent: string;
  density: string;
  cardStyle: string;
  heroStyle: string;
  backgroundStyle: string;
  cartStyle: string;
  showProductImages: string;
  logoUrl: string;
  coverUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  welcomeMessage: string;
  menuLanguages: string;
  defaultLanguage: string;
  publicMenuBackgroundSection: string;
  publicMenuBackgroundNote: string;
  publicMenuBackgroundImageUrl: string;
  publicMenuBackgroundUpload: string;
  publicMenuBackgroundMode: string;
  publicMenuBackgroundPosition: string;
  publicMenuBackgroundOverlay: string;
  publicMenuBackgroundOverlayOpacity: string;
  publicMenuSurfaceStyle: string;
  // Translation CSV workflow
  transExportTitle: string;
  transExportButton: string;
  transExportDesc: string;
  transImportTitle: string;
  transImportDesc: string;
  transFileLabel: string;
  transAnalysing: string;
  transRowsFound: string;
  transValid: string;
  transWarnings: string;
  transInvalid: string;
  transUnknownProducts: string;
  transSkipInvalid: string;
  transConfirm: string;
  transCommitting: string;
  transDiscard: string;
  transSuccess: string;
  transReadError: string;
  transCommitError: string;
  brandingLink: string;
  translationsLink: string;
  maintenance: string;
  maintenanceTitle: string;
  maintenanceSubtitle: string;
  retentionCleanupTitle: string;
  retentionCleanupDescription: string;
  retentionDaysLabel: string;
  retentionPreviewButton: string;
  retentionExecuteButton: string;
  retentionConfirmLabel: string;
  retentionPreviewing: string;
  retentionExecuting: string;
  retentionOrders: string;
  retentionOrderItems: string;
  retentionEmptySessions: string;
  retentionCutoff: string;
  retentionSuccess: string;
  retentionNonTerminalNote: string;
  retentionCronNote: string;
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
    filterAll: "Todos",
    name: "Nome",
    slug: "Slug",
    orders: "Pedidos",
    hoursToday: "Horário hoje",
    actions: "Ações",
    acceptingOrders: "A aceitar pedidos",
    ordersPaused: "Em pausa",
    openToday: "Aberto hoje",
    closedToday: "Fechado hoje",
    hoursNotConfigured: "Horário não configurado",
    emptyFilterTitle: "Sem restaurantes para este filtro.",
    emptyFilterDescription: "Experimente outro estado ou crie um restaurante novo.",
    activate: "Ativar",
    suspend: "Suspender",
    details: "Detalhes",
    backToRestaurant: "← Voltar ao restaurante",
    translationsTitle: "Traduções (CSV)",
    translationsSubtitle:
      "Exporte as traduções do menu, traduza o CSV fora da app e importe aqui. As alterações são pré-visualizadas antes de serem aplicadas.",
    brandingTitle: "Marca & menu público",
    brandingSubtitle:
      "Cores, imagens, mensagem de boas-vindas e o template visual do menu QR (/t/[token]).",
    previewPublicMenu: "Pré-visualizar menu público",
    createTableFirst: "Crie uma mesa primeiro para pré-visualizar o menu público.",
    restaurantBrandingNote:
      "O proprietário do restaurante também pode editar cores e idiomas em /restaurant/branding. O template do menu público é controlado aqui.",
    saveBranding: "Guardar",
    saving: "A guardar…",
    saved: "Guardado.",
    templatePreset: "Template do menu",
    templateIntent: "Intenção visual",
    density: "Densidade",
    cardStyle: "Estilo dos cartões",
    heroStyle: "Hero",
    backgroundStyle: "Fundo",
    cartStyle: "Carrinho",
    showProductImages: "Mostrar fotos dos produtos",
    logoUrl: "URL do logo",
    coverUrl: "URL da capa",
    primaryColor: "Cor principal",
    secondaryColor: "Cor secundária",
    backgroundColor: "Cor de fundo",
    welcomeMessage: "Mensagem de boas-vindas",
    menuLanguages: "Idiomas do menu",
    defaultLanguage: "Idioma predefinido",
    publicMenuBackgroundSection: "Fundo do menu público",
    publicMenuBackgroundNote:
      "Esta imagem só altera a atmosfera de fundo. Botões e destaques continuam a usar as cores principal e secundária.",
    publicMenuBackgroundImageUrl: "URL da imagem de fundo",
    publicMenuBackgroundUpload: "Carregar imagem",
    publicMenuBackgroundMode: "Modo da imagem",
    publicMenuBackgroundPosition: "Posição",
    publicMenuBackgroundOverlay: "Sobreposição",
    publicMenuBackgroundOverlayOpacity: "Opacidade da sobreposição (0–90)",
    publicMenuSurfaceStyle: "Superfície dos cartões",
    transExportTitle: "1 · Exportar",
    transExportButton: "Descarregar CSV de traduções",
    transExportDesc:
      "Uma linha por produto com product_id, category_id, preço e alergénios (contexto) mais colunas PT/EN/ES/FR.",
    transImportTitle: "2 · Importar com pré-visualização",
    transImportDesc:
      "Carregue o CSV traduzido. Nada é alterado até confirmar. IDs inválidos para este restaurante bloqueiam o commit.",
    transFileLabel: "Ficheiro CSV traduzido",
    transAnalysing: "A analisar",
    transRowsFound: "Linhas",
    transValid: "Válidas",
    transWarnings: "Avisos",
    transInvalid: "Inválidas",
    transUnknownProducts: "IDs de produto desconhecidos:",
    transSkipInvalid:
      "Ignorar as {count} linha(s) inválida(s) e importar só as válidas. Desmarcado bloqueia o commit.",
    transConfirm: "Confirmar importação",
    transCommitting: "A importar…",
    transDiscard: "Descartar pré-visualização",
    transSuccess:
      "Importação concluída: {products} tradução(ões) de produto e {categories} de categoria{skipped}.",
    transReadError: "Não foi possível ler o ficheiro CSV.",
    transCommitError: "Não foi possível concluir a importação.",
    brandingLink: "Marca & menu",
    translationsLink: "Traduções CSV",
    maintenance: "Manutenção",
    maintenanceTitle: "Manutenção da plataforma",
    maintenanceSubtitle:
      "Ferramentas administrativas para limpeza de dados antigos. Apenas administradores da plataforma.",
    retentionCleanupTitle: "Limpeza de retenção de pedidos",
    retentionCleanupDescription:
      "Remove pedidos terminais (entregues, cancelados, rejeitados) mais antigos que o período selecionado. Os registos de auditoria são sempre mantidos.",
    retentionDaysLabel: "Retenção (dias)",
    retentionPreviewButton: "Pré-visualizar limpeza",
    retentionExecuteButton: "Confirmar limpeza",
    retentionConfirmLabel: "Escreva para confirmar:",
    retentionPreviewing: "A analisar…",
    retentionExecuting: "A apagar…",
    retentionOrders: "Pedidos",
    retentionOrderItems: "Linhas de pedido",
    retentionEmptySessions: "Sessões vazias",
    retentionCutoff: "Corte em",
    retentionSuccess: "Limpeza concluída",
    retentionNonTerminalNote:
      "Pedidos em curso (novo, a preparar, pronto, por confirmar) nunca são apagados, mesmo que sejam antigos.",
    retentionCronNote:
      "Limpeza automática agendada (cron) não está ativa nesta versão — apenas limpeza manual pelo administrador.",
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
    filterAll: "All",
    name: "Name",
    slug: "Slug",
    orders: "Orders",
    hoursToday: "Hours today",
    actions: "Actions",
    acceptingOrders: "Accepting orders",
    ordersPaused: "Paused",
    openToday: "Open today",
    closedToday: "Closed today",
    hoursNotConfigured: "Hours not configured",
    emptyFilterTitle: "No restaurants for this filter.",
    emptyFilterDescription: "Try another status or create a new restaurant.",
    activate: "Activate",
    suspend: "Suspend",
    details: "Details",
    backToRestaurant: "← Back to restaurant",
    translationsTitle: "Translations (CSV)",
    translationsSubtitle:
      "Export the current menu translations, translate the CSV outside the app, then import it here. Changes are previewed before they are applied.",
    brandingTitle: "Branding & public menu",
    brandingSubtitle:
      "Colors, images, welcome message and the visual template for the QR menu (/t/[token]).",
    previewPublicMenu: "Preview public menu",
    createTableFirst: "Create a table first to preview the public menu.",
    restaurantBrandingNote:
      "The restaurant owner can also edit colors and languages at /restaurant/branding. The public menu template is controlled here.",
    saveBranding: "Save",
    saving: "Saving…",
    saved: "Saved.",
    templatePreset: "Menu template",
    templateIntent: "Visual intent",
    density: "Density",
    cardStyle: "Card style",
    heroStyle: "Hero style",
    backgroundStyle: "Background",
    cartStyle: "Cart style",
    showProductImages: "Show product photos",
    logoUrl: "Logo URL",
    coverUrl: "Cover image URL",
    primaryColor: "Primary color",
    secondaryColor: "Secondary color",
    backgroundColor: "Background color",
    welcomeMessage: "Welcome message",
    menuLanguages: "Menu languages",
    defaultLanguage: "Default language",
    publicMenuBackgroundSection: "Public menu background",
    publicMenuBackgroundNote:
      "This image only changes the background atmosphere. Buttons and accents still use the primary and secondary colors.",
    publicMenuBackgroundImageUrl: "Background image URL",
    publicMenuBackgroundUpload: "Upload image",
    publicMenuBackgroundMode: "Image mode",
    publicMenuBackgroundPosition: "Position",
    publicMenuBackgroundOverlay: "Overlay",
    publicMenuBackgroundOverlayOpacity: "Overlay opacity (0–90)",
    publicMenuSurfaceStyle: "Card surface style",
    transExportTitle: "1 · Export",
    transExportButton: "Download translation CSV",
    transExportDesc:
      "One row per product with product_id, category_id, price and allergens (context) plus PT/EN/ES/FR columns.",
    transImportTitle: "2 · Import with preview",
    transImportDesc:
      "Upload the translated CSV. Nothing changes until you confirm. Invalid IDs for this restaurant block the commit.",
    transFileLabel: "Translated CSV file",
    transAnalysing: "Analysing",
    transRowsFound: "Rows",
    transValid: "Valid",
    transWarnings: "Warnings",
    transInvalid: "Invalid",
    transUnknownProducts: "Unknown product IDs:",
    transSkipInvalid:
      "Skip the {count} invalid row(s) and import only valid ones. Unchecked blocks the commit.",
    transConfirm: "Confirm import",
    transCommitting: "Committing…",
    transDiscard: "Discard preview",
    transSuccess:
      "Import committed: {products} product translation(s) and {categories} category translation(s){skipped}.",
    transReadError: "Could not read the CSV file.",
    transCommitError: "Could not commit the import.",
    brandingLink: "Branding & menu",
    translationsLink: "Translations CSV",
    maintenance: "Maintenance",
    maintenanceTitle: "Platform maintenance",
    maintenanceSubtitle:
      "Administrative tools for cleaning up old data. Platform administrators only.",
    retentionCleanupTitle: "Order retention cleanup",
    retentionCleanupDescription:
      "Deletes terminal orders (delivered, cancelled, rejected) older than the selected period. Audit logs are always kept.",
    retentionDaysLabel: "Retention (days)",
    retentionPreviewButton: "Preview cleanup",
    retentionExecuteButton: "Confirm cleanup",
    retentionConfirmLabel: "Type to confirm:",
    retentionPreviewing: "Analysing…",
    retentionExecuting: "Deleting…",
    retentionOrders: "Orders",
    retentionOrderItems: "Order lines",
    retentionEmptySessions: "Empty sessions",
    retentionCutoff: "Cutoff at",
    retentionSuccess: "Cleanup completed",
    retentionNonTerminalNote:
      "In-progress orders (new, preparing, ready, pending confirmation) are never deleted, even when old.",
    retentionCronNote:
      "Scheduled automatic cleanup (cron) is not enabled in this release — manual admin cleanup only.",
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
    allergens: "Alergénios",
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

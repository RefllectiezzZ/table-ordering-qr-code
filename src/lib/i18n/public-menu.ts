import type { Language } from "@/types/database";

export const LANGUAGE_LABELS: Record<Language, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
};

/** UI strings for the public QR menu, per language. */
export interface PublicMenuStrings {
  table: string;
  menu: string;
  cart: string;
  addToCart: string;
  unavailable: string;
  allergens: string;
  quantity: string;
  itemNotePlaceholder: string;
  orderNotePlaceholder: string;
  orderNoteLabel: string;
  total: string;
  submitOrder: string;
  submitting: string;
  emptyCart: string;
  emptyMenu: string;
  orderReceivedTitle: string;
  orderReceivedBody: string;
  orderNumber: string;
  newOrder: string;
  viewCart: string;
  closeCart: string;
  backToMenu: string;
  remove: string;
  orderFailed: string;
  allergenDisclaimer: string;
  invalidTokenTitle: string;
  invalidTokenBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  // Pause / availability
  ordersPausedBanner: string;
  ordersPausedSubmit: string;
  // Opening hours
  openNow: string;
  closedNow: string;
  todayHours: string;
  closedBanner: string;
  closedSubmit: string;
  // First-order confirmation flow
  pendingTitle: string;
  pendingBody: string;
  pendingHint: string;
  confirmedTitle: string;
  confirmedBody: string;
  rejectedTitle: string;
  rejectedBody: string;
  sessionEndedNotice: string;
  orderStatusLabel: string;
  statusPending: string;
  statusConfirmed: string;
  statusPreparing: string;
  statusReady: string;
  statusDelivered: string;
  statusRejected: string;
  statusCancelled: string;
}

export const PUBLIC_MENU_STRINGS: Record<Language, PublicMenuStrings> = {
  pt: {
    table: "Mesa",
    menu: "Menu",
    cart: "Carrinho",
    addToCart: "Adicionar",
    unavailable: "Indisponível",
    allergens: "Alergénios",
    quantity: "Quantidade",
    itemNotePlaceholder: "Nota para este item (opcional)",
    orderNotePlaceholder: "Nota para o restaurante (opcional)",
    orderNoteLabel: "Nota do pedido",
    total: "Total",
    submitOrder: "Enviar pedido",
    submitting: "A enviar…",
    emptyCart: "O carrinho está vazio.",
    emptyMenu: "Este menu ainda não tem produtos disponíveis.",
    orderReceivedTitle: "Pedido recebido!",
    orderReceivedBody: "O seu pedido foi enviado para a cozinha.",
    orderNumber: "Pedido",
    newOrder: "Fazer novo pedido",
    viewCart: "Ver carrinho",
    closeCart: "Continuar a ver o menu",
    backToMenu: "Voltar ao menu",
    remove: "Remover",
    orderFailed: "Não foi possível enviar o pedido. Tente novamente.",
    allergenDisclaimer:
      "Tem alergias ou intolerâncias alimentares? Confirme com a equipa do restaurante antes de consumir.",
    invalidTokenTitle: "QR code inválido",
    invalidTokenBody:
      "Este QR code não é válido ou já não está ativo. Peça ajuda à equipa do restaurante.",
    unavailableTitle: "Menu indisponível",
    unavailableBody: "Este restaurante não está disponível de momento.",
    ordersPausedBanner: "O restaurante não está a aceitar pedidos neste momento.",
    ordersPausedSubmit: "Os pedidos estão em pausa. Pode continuar a ver o menu.",
    openNow: "Aberto",
    closedNow: "Fechado",
    todayHours: "Hoje",
    closedBanner: "O restaurante está fora do horário de funcionamento.",
    closedSubmit:
      "Fora do horário de funcionamento. Pode continuar a ver o menu, mas não é possível enviar pedidos.",
    pendingTitle: "Pedido recebido",
    pendingBody: "A equipa vai confirmar a mesa.",
    pendingHint: "Pode manter esta página aberta; o estado atualiza automaticamente.",
    confirmedTitle: "Pedido confirmado",
    confirmedBody: "O seu pedido foi enviado para a cozinha.",
    rejectedTitle: "Pedido não confirmado",
    rejectedBody: "Peça ajuda à equipa do restaurante.",
    sessionEndedNotice:
      "Esta sessão de mesa terminou. Peça ajuda à equipa ou leia novamente o QR se necessário.",
    orderStatusLabel: "Estado",
    statusPending: "A aguardar confirmação",
    statusConfirmed: "Confirmado",
    statusPreparing: "Em preparação",
    statusReady: "Pronto",
    statusDelivered: "Entregue",
    statusRejected: "Rejeitado",
    statusCancelled: "Cancelado",
  },
  en: {
    table: "Table",
    menu: "Menu",
    cart: "Cart",
    addToCart: "Add",
    unavailable: "Unavailable",
    allergens: "Allergens",
    quantity: "Quantity",
    itemNotePlaceholder: "Note for this item (optional)",
    orderNotePlaceholder: "Note for the restaurant (optional)",
    orderNoteLabel: "Order note",
    total: "Total",
    submitOrder: "Place order",
    submitting: "Sending…",
    emptyCart: "Your cart is empty.",
    emptyMenu: "This menu has no available products yet.",
    orderReceivedTitle: "Order received!",
    orderReceivedBody: "Your order has been sent to the kitchen.",
    orderNumber: "Order",
    newOrder: "Place another order",
    viewCart: "View cart",
    closeCart: "Keep browsing the menu",
    backToMenu: "Back to the menu",
    remove: "Remove",
    orderFailed: "We could not send your order. Please try again.",
    allergenDisclaimer:
      "Food allergies or intolerances? Please confirm with the restaurant staff before consuming.",
    invalidTokenTitle: "Invalid QR code",
    invalidTokenBody:
      "This QR code is not valid or is no longer active. Please ask the restaurant staff for help.",
    unavailableTitle: "Menu unavailable",
    unavailableBody: "This restaurant is currently unavailable.",
    ordersPausedBanner: "The restaurant is not taking orders right now.",
    ordersPausedSubmit: "Ordering is paused. You can keep browsing the menu.",
    openNow: "Open",
    closedNow: "Closed",
    todayHours: "Today",
    closedBanner: "The restaurant is outside opening hours.",
    closedSubmit:
      "Outside opening hours. You can keep browsing the menu, but orders cannot be sent.",
    pendingTitle: "Order received",
    pendingBody: "The staff will confirm your table.",
    pendingHint: "You can keep this page open; the status updates automatically.",
    confirmedTitle: "Order confirmed",
    confirmedBody: "Your order has been sent to the kitchen.",
    rejectedTitle: "Order not confirmed",
    rejectedBody: "Please ask the restaurant staff for help.",
    sessionEndedNotice:
      "This table session has ended. Ask the staff for help or scan the QR code again if needed.",
    orderStatusLabel: "Status",
    statusPending: "Waiting for confirmation",
    statusConfirmed: "Confirmed",
    statusPreparing: "Being prepared",
    statusReady: "Ready",
    statusDelivered: "Delivered",
    statusRejected: "Rejected",
    statusCancelled: "Cancelled",
  },
  es: {
    table: "Mesa",
    menu: "Menú",
    cart: "Carrito",
    addToCart: "Añadir",
    unavailable: "No disponible",
    allergens: "Alérgenos",
    quantity: "Cantidad",
    itemNotePlaceholder: "Nota para este artículo (opcional)",
    orderNotePlaceholder: "Nota para el restaurante (opcional)",
    orderNoteLabel: "Nota del pedido",
    total: "Total",
    submitOrder: "Enviar pedido",
    submitting: "Enviando…",
    emptyCart: "El carrito está vacío.",
    emptyMenu: "Este menú aún no tiene productos disponibles.",
    orderReceivedTitle: "¡Pedido recibido!",
    orderReceivedBody: "Su pedido ha sido enviado a la cocina.",
    orderNumber: "Pedido",
    newOrder: "Hacer otro pedido",
    viewCart: "Ver carrito",
    closeCart: "Seguir viendo el menú",
    backToMenu: "Volver al menú",
    remove: "Eliminar",
    orderFailed: "No se pudo enviar el pedido. Inténtelo de nuevo.",
    allergenDisclaimer:
      "¿Alergias o intolerancias alimentarias? Confirme con el personal del restaurante antes de consumir.",
    invalidTokenTitle: "Código QR no válido",
    invalidTokenBody:
      "Este código QR no es válido o ya no está activo. Pida ayuda al personal del restaurante.",
    unavailableTitle: "Menú no disponible",
    unavailableBody: "Este restaurante no está disponible en este momento.",
    ordersPausedBanner: "El restaurante no está aceptando pedidos en este momento.",
    ordersPausedSubmit: "Los pedidos están en pausa. Puede seguir viendo el menú.",
    openNow: "Abierto",
    closedNow: "Cerrado",
    todayHours: "Hoy",
    closedBanner: "El restaurante está fuera del horario de apertura.",
    closedSubmit:
      "Fuera del horario de apertura. Puede seguir viendo el menú, pero no es posible enviar pedidos.",
    pendingTitle: "Pedido recibido",
    pendingBody: "El personal confirmará la mesa.",
    pendingHint: "Puede mantener esta página abierta; el estado se actualiza automáticamente.",
    confirmedTitle: "Pedido confirmado",
    confirmedBody: "Su pedido ha sido enviado a la cocina.",
    rejectedTitle: "Pedido no confirmado",
    rejectedBody: "Pida ayuda al personal del restaurante.",
    sessionEndedNotice:
      "Esta sesión de mesa ha terminado. Pida ayuda al personal o escanee de nuevo el código QR.",
    orderStatusLabel: "Estado",
    statusPending: "Esperando confirmación",
    statusConfirmed: "Confirmado",
    statusPreparing: "En preparación",
    statusReady: "Listo",
    statusDelivered: "Entregado",
    statusRejected: "Rechazado",
    statusCancelled: "Cancelado",
  },
  fr: {
    table: "Table",
    menu: "Menu",
    cart: "Panier",
    addToCart: "Ajouter",
    unavailable: "Indisponible",
    allergens: "Allergènes",
    quantity: "Quantité",
    itemNotePlaceholder: "Note pour cet article (facultatif)",
    orderNotePlaceholder: "Note pour le restaurant (facultatif)",
    orderNoteLabel: "Note de commande",
    total: "Total",
    submitOrder: "Envoyer la commande",
    submitting: "Envoi…",
    emptyCart: "Votre panier est vide.",
    emptyMenu: "Ce menu n'a pas encore de produits disponibles.",
    orderReceivedTitle: "Commande reçue !",
    orderReceivedBody: "Votre commande a été envoyée en cuisine.",
    orderNumber: "Commande",
    newOrder: "Passer une autre commande",
    viewCart: "Voir le panier",
    closeCart: "Continuer à parcourir le menu",
    backToMenu: "Retour au menu",
    remove: "Supprimer",
    orderFailed: "Impossible d'envoyer la commande. Veuillez réessayer.",
    allergenDisclaimer:
      "Allergies ou intolérances alimentaires ? Confirmez auprès du personnel du restaurant avant de consommer.",
    invalidTokenTitle: "QR code non valide",
    invalidTokenBody:
      "Ce QR code n'est pas valide ou n'est plus actif. Demandez de l'aide au personnel du restaurant.",
    unavailableTitle: "Menu indisponible",
    unavailableBody: "Ce restaurant n'est pas disponible pour le moment.",
    ordersPausedBanner: "Le restaurant n'accepte pas de commandes pour le moment.",
    ordersPausedSubmit: "Les commandes sont en pause. Vous pouvez continuer à consulter le menu.",
    openNow: "Ouvert",
    closedNow: "Fermé",
    todayHours: "Aujourd'hui",
    closedBanner: "Le restaurant est en dehors des horaires d'ouverture.",
    closedSubmit:
      "En dehors des horaires d'ouverture. Vous pouvez consulter le menu, mais les commandes ne peuvent pas être envoyées.",
    pendingTitle: "Commande reçue",
    pendingBody: "Le personnel va confirmer la table.",
    pendingHint: "Vous pouvez garder cette page ouverte ; le statut se met à jour automatiquement.",
    confirmedTitle: "Commande confirmée",
    confirmedBody: "Votre commande a été envoyée en cuisine.",
    rejectedTitle: "Commande non confirmée",
    rejectedBody: "Demandez de l'aide au personnel du restaurant.",
    sessionEndedNotice:
      "Cette session de table est terminée. Demandez de l'aide au personnel ou scannez à nouveau le QR code.",
    orderStatusLabel: "Statut",
    statusPending: "En attente de confirmation",
    statusConfirmed: "Confirmée",
    statusPreparing: "En préparation",
    statusReady: "Prête",
    statusDelivered: "Servie",
    statusRejected: "Refusée",
    statusCancelled: "Annulée",
  },
};

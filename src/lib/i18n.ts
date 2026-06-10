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
  remove: string;
  orderFailed: string;
  allergenDisclaimer: string;
  invalidTokenTitle: string;
  invalidTokenBody: string;
  unavailableTitle: string;
  unavailableBody: string;
}

export const PUBLIC_MENU_STRINGS: Record<Language, PublicMenuStrings> = {
  pt: {
    table: "Mesa",
    menu: "Menu",
    cart: "Carrinho",
    addToCart: "Adicionar",
    unavailable: "Indisponível",
    allergens: "Alérgenos",
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
    remove: "Remover",
    orderFailed: "Não foi possível enviar o pedido. Tente novamente.",
    allergenDisclaimer:
      "Tem alergias ou intolerâncias alimentares? Confirme com a equipa do restaurante antes de consumir.",
    invalidTokenTitle: "QR code inválido",
    invalidTokenBody:
      "Este QR code não é válido ou já não está ativo. Peça ajuda à equipa do restaurante.",
    unavailableTitle: "Menu indisponível",
    unavailableBody: "Este restaurante não está disponível de momento.",
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
    remove: "Remove",
    orderFailed: "We could not send your order. Please try again.",
    allergenDisclaimer:
      "Food allergies or intolerances? Please confirm with the restaurant staff before consuming.",
    invalidTokenTitle: "Invalid QR code",
    invalidTokenBody:
      "This QR code is not valid or is no longer active. Please ask the restaurant staff for help.",
    unavailableTitle: "Menu unavailable",
    unavailableBody: "This restaurant is currently unavailable.",
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
    remove: "Eliminar",
    orderFailed: "No se pudo enviar el pedido. Inténtelo de nuevo.",
    allergenDisclaimer:
      "¿Alergias o intolerancias alimentarias? Confirme con el personal del restaurante antes de consumir.",
    invalidTokenTitle: "Código QR no válido",
    invalidTokenBody:
      "Este código QR no es válido o ya no está activo. Pida ayuda al personal del restaurante.",
    unavailableTitle: "Menú no disponible",
    unavailableBody: "Este restaurante no está disponible en este momento.",
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
    remove: "Supprimer",
    orderFailed: "Impossible d'envoyer la commande. Veuillez réessayer.",
    allergenDisclaimer:
      "Allergies ou intolérances alimentaires ? Confirmez auprès du personnel du restaurant avant de consommer.",
    invalidTokenTitle: "QR code non valide",
    invalidTokenBody:
      "Ce QR code n'est pas valide ou n'est plus actif. Demandez de l'aide au personnel du restaurant.",
    unavailableTitle: "Menu indisponible",
    unavailableBody: "Ce restaurant n'est pas disponible pour le moment.",
  },
};

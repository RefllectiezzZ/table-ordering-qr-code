import type { Language } from "@/types/database";

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  pt: "pt-PT",
  en: "en-IE",
  es: "es-ES",
  fr: "fr-FR",
};

/** Formats integer cents as a localized EUR amount, e.g. 350 -> "3,50 €". */
export function formatCentsToEuro(cents: number, language: Language = "pt"): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Formats integer cents as a plain decimal string for form inputs / CSV, e.g. 350 -> "3.50". */
export function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Parses a human-entered EUR amount ("3.50", "3,50", "12", "1 234,56", "3,50 €")
 * into integer cents. Returns null for anything ambiguous or invalid —
 * never guesses.
 */
export function parseEuroToCents(input: string): number | null {
  let value = input.trim().replace(/€/g, "").replace(/\s/g, "");
  if (value.length === 0) return null;

  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  if (hasComma && hasDot) {
    // Whichever separator comes last is the decimal separator.
    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    if (lastComma > lastDot) {
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (hasComma) {
    if ((value.match(/,/g) ?? []).length > 1) return null;
    value = value.replace(",", ".");
  } else if (hasDot) {
    if ((value.match(/\./g) ?? []).length > 1) return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;

  const cents = Math.round(parseFloat(value) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) return null;
  return cents;
}

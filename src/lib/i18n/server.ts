import "server-only";

import { cookies } from "next/headers";
import {
  APP_LANGUAGE_COOKIE,
  DEFAULT_APP_LANGUAGE,
  isAppLanguage,
  type AppLanguage,
} from "@/lib/i18n/app";

/**
 * Current PT/EN interface language for landing/admin/legal pages, read from a
 * cookie set by the LanguageToggle component. Portuguese is the default.
 */
export async function getAppLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  const value = cookieStore.get(APP_LANGUAGE_COOKIE)?.value;
  return isAppLanguage(value) ? value : DEFAULT_APP_LANGUAGE;
}

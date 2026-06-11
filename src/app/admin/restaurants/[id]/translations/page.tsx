import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  AdminTranslationsManager,
  type AdminTranslationsCopy,
} from "@/components/admin/translations-manager";
import { ADMIN_STRINGS } from "@/lib/i18n/app";
import { getAppLanguage } from "@/lib/i18n/server";
import { requirePlatformAdmin } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantRow } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Restaurant translations" };

export default async function AdminRestaurantTranslationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const lang = await getAppLanguage();
  const t = ADMIN_STRINGS[lang];
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, status")
    .eq("id", id)
    .maybeSingle<Pick<RestaurantRow, "id" | "name" | "status">>();

  if (!restaurant) notFound();

  const copy: AdminTranslationsCopy = {
    exportTitle: t.transExportTitle,
    exportDescription: t.transExportDesc,
    exportButton: t.transExportButton,
    importTitle: t.transImportTitle,
    importDescription: t.transImportDesc,
    fileLabel: t.transFileLabel,
    analysing: t.transAnalysing,
    rowsFound: t.transRowsFound,
    valid: t.transValid,
    warnings: t.transWarnings,
    invalid: t.transInvalid,
    matched: "",
    unknownProducts: t.transUnknownProducts,
    skipInvalid: t.transSkipInvalid,
    confirm: t.transConfirm,
    committing: t.transCommitting,
    discard: t.transDiscard,
    success: t.transSuccess,
    readError: t.transReadError,
    commitError: t.transCommitError,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/restaurants/${restaurant.id}`}
          className="text-xs text-slate-500 hover:underline"
        >
          {t.backToRestaurant}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{t.translationsTitle}</h1>
          <Badge
            tone={
              restaurant.status === "active"
                ? "green"
                : restaurant.status === "suspended"
                  ? "yellow"
                  : "neutral"
            }
          >
            {restaurant.status}
          </Badge>
          <span className="text-sm text-slate-500">{restaurant.name}</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{t.translationsSubtitle}</p>
      </div>

      <AdminTranslationsManager restaurantId={restaurant.id} copy={copy} />
    </div>
  );
}

import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { translationsCommitSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { commitTranslationImport } from "@/server/translations";

export const dynamic = "force-dynamic";

/** Commits a previewed batch after explicit confirmation. */
export async function POST(request: Request) {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, translationsCommitSchema);
  if (!parsed.ok) return parsed.response;

  const result = await commitTranslationImport(
    auth.supabase,
    auth.restaurantId!,
    parsed.data.batch_id,
    parsed.data.skip_unknown,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, message: result.message },
      { status: result.status },
    );
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "translation_import.committed",
    entityType: "import_batch",
    entityId: parsed.data.batch_id,
    metadata: {
      product_translations: result.productTranslationsUpserted,
      category_translations: result.categoryTranslationsUpserted,
      skipped_rows: result.skippedRows,
    },
  });

  return NextResponse.json({
    committed: true,
    product_translations_upserted: result.productTranslationsUpserted,
    category_translations_upserted: result.categoryTranslationsUpserted,
    skipped_rows: result.skippedRows,
  });
}

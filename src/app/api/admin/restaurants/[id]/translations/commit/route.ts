import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { translationsCommitSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { commitTranslationImport } from "@/server/translations";

export const dynamic = "force-dynamic";

/** Platform admin: commit a previewed translation import for a specific restaurant. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const { id: restaurantId } = await context.params;

  const { data: restaurant } = await auth.supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, translationsCommitSchema);
  if (!parsed.ok) return parsed.response;

  const result = await commitTranslationImport(
    auth.supabase,
    restaurantId,
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
    restaurantId,
    actorUserId: auth.userId,
    action: "translations.imported",
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

import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { translationsPreviewSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { previewTranslationImport } from "@/server/translations";

export const dynamic = "force-dynamic";

/** Stage an uploaded translation CSV as a preview batch. Nothing is committed. */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, translationsPreviewSchema);
  if (!parsed.ok) return parsed.response;

  const result = await previewTranslationImport(
    auth.supabase,
    auth.restaurantId!,
    auth.userId,
    parsed.data.csv_content,
    parsed.data.filename,
  );

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: result.status });
  }

  await logAudit({
    restaurantId: auth.restaurantId,
    actorUserId: auth.userId,
    action: "translation_import.previewed",
    entityType: "import_batch",
    entityId: result.batchId,
    metadata: { total_rows: result.summary.totalRows, invalid_rows: result.summary.invalidRows },
  });

  return NextResponse.json({
    batch_id: result.batchId,
    summary: result.summary,
    rows: result.rows,
  });
}

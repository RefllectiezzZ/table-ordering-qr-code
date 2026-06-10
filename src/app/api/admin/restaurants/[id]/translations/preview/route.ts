import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { translationsPreviewSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";
import { previewTranslationImport } from "@/server/translations";

export const dynamic = "force-dynamic";

/** Platform admin: stage a translation CSV preview for a specific restaurant. */
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

  const parsed = await parseJsonBody(request, translationsPreviewSchema);
  if (!parsed.ok) return parsed.response;

  const result = await previewTranslationImport(
    auth.supabase,
    restaurantId,
    auth.userId,
    parsed.data.csv_content,
    parsed.data.filename,
  );

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: result.status });
  }

  await logAudit({
    restaurantId,
    actorUserId: auth.userId,
    action: "translations.import_previewed",
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

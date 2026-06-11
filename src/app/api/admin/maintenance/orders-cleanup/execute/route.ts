import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/security/api-guards";
import { requireSameOrigin } from "@/lib/security/origin";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { ordersCleanupSchema } from "@/lib/validation/schemas";
import { executeOrdersCleanup } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireApiPlatformAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, ordersCleanupSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await executeOrdersCleanup(parsed.data.retention_days, auth.userId);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Could not execute cleanup" }, { status: 500 });
  }
}

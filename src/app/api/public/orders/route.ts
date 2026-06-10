import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { publicOrderSchema } from "@/lib/validation/schemas";
import { createPublicOrder } from "@/server/public-orders";

export const dynamic = "force-dynamic";

/**
 * Public order submission — the only unauthenticated mutation in the app.
 *
 * The restaurant and table are derived exclusively from the QR token.
 * Prices come from the database. (restaurant_id, client_order_token) is
 * unique, making retries idempotent. No PII is requested or logged.
 *
 * Rate limiting is documented as a launch-gate follow-up
 * (docs/security/guardrails.md).
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, publicOrderSchema);
  if (!parsed.ok) return parsed.response;

  const result = await createPublicOrder(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: result.status });
  }

  return NextResponse.json(
    {
      order: {
        id: result.order.orderId,
        short_code: result.order.shortCode,
        status: result.order.status,
        total_cents: result.order.totalCents,
        created_at: result.order.createdAt,
      },
      deduplicated: result.deduplicated,
    },
    { status: result.deduplicated ? 200 : 201 },
  );
}

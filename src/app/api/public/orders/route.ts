import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
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
 * Intentionally NOT behind the same-origin guard (customers may open the QR
 * link from anywhere); abuse resistance comes from strict validation plus a
 * best-effort in-memory rate limit per IP + table token. The 20/min budget
 * never blocks legitimate idempotent retries of the same client_order_token.
 * A distributed limiter remains a launch gate (docs/launch/launch-gates.md).
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, publicOrderSchema);
  if (!parsed.ok) return parsed.response;

  const rate = checkRateLimit(`${getClientIp(request)}:${parsed.data.table_token}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

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

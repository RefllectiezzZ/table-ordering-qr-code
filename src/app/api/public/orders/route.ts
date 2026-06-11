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
 * Abuse model for printed (fixed) QR codes: an order WITHOUT a valid browser
 * authorization token starts as pending_confirmation and never reaches the
 * kitchen until staff confirms it. A valid session token (granted after the
 * first confirmed order, while the table session stays open) sends the order
 * straight to "new".
 *
 * Intentionally NOT behind the same-origin guard (customers may open the QR
 * link from anywhere); abuse resistance comes from strict validation, the
 * confirmation flow above and server-side rate limiting (HMAC-hashed keys in
 * public_order_attempts — no raw IP storage). Idempotent retries of the
 * same client_order_token bypass the limiter.
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, publicOrderSchema);
  if (!parsed.ok) return parsed.response;

  const result = await createPublicOrder(parsed.data, request);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.code,
        ...(result.message ? { message: result.message } : {}),
      },
      {
        status: result.status,
        ...(result.code === "rate_limited" ? { headers: { "Retry-After": "60" } } : {}),
      },
    );
  }

  return NextResponse.json(
    {
      order: {
        id: result.order.orderId,
        short_code: result.order.shortCode,
        order_number: result.order.orderNumber,
        status: result.order.status,
        total_cents: result.order.totalCents,
        created_at: result.order.createdAt,
      },
      deduplicated: result.deduplicated,
      session_ended: result.sessionEnded,
    },
    { status: result.deduplicated ? 200 : 201 },
  );
}

import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { publicOrderStatusQuerySchema } from "@/lib/validation/schemas";
import { getPublicOrderStatus } from "@/server/public-orders";

export const dynamic = "force-dynamic";

/**
 * Generous poll budget: each client polls every ~5s only while an order is
 * moving, but several devices at one restaurant often share a NAT IP.
 */
const STATUS_POLL_LIMIT = 240;

/**
 * Public order status poll for the QR menu.
 *
 * Requires BOTH the table's QR token and the order's client_order_token (a
 * random UUID known only to the device that placed the order), so only that
 * device can read the order status. When staff has confirmed the device's
 * first order, the response carries the browser authorization token exactly
 * once; subsequent polls never repeat it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = publicOrderStatusQuerySchema.safeParse({
    table_token: url.searchParams.get("table_token") ?? "",
    client_order_token: url.searchParams.get("client_order_token") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const rate = checkRateLimit(
    `status:${getClientIp(request)}:${parsed.data.table_token}`,
    { limit: STATUS_POLL_LIMIT },
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const result = await getPublicOrderStatus(
    parsed.data.table_token,
    parsed.data.client_order_token,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: result.status });
  }

  return NextResponse.json(
    {
      order: {
        id: result.order.orderId,
        short_code: result.order.shortCode,
        order_number: result.order.orderNumber,
        status: result.order.status,
      },
      session_token: result.sessionToken,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

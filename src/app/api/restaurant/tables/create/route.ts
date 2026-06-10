import { NextResponse } from "next/server";
import { requireApiRestaurantOwner } from "@/lib/security/api-guards";
import { generateTableToken } from "@/lib/security/tokens";
import { parseJsonBody } from "@/lib/validation/parse-request";
import { tableCreateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiRestaurantOwner();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, tableCreateSchema);
  if (!parsed.ok) return parsed.response;

  // Tokens are generated server-side only and never reused. The retry loop
  // covers the (astronomically unlikely) global token collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = generateTableToken();

    const { data: table, error } = await auth.supabase
      .from("restaurant_tables")
      .insert({
        restaurant_id: auth.restaurantId!,
        table_number: parsed.data.table_number,
        label: parsed.data.label,
        public_token: token,
        status: "active",
      })
      .select("id, public_token")
      .single<{ id: string; public_token: string }>();

    if (!error && table) {
      await logAudit({
        restaurantId: auth.restaurantId,
        actorUserId: auth.userId,
        action: "table.created",
        entityType: "restaurant_table",
        entityId: table.id,
        metadata: { table_number: parsed.data.table_number },
      });
      return NextResponse.json({ table: { id: table.id } }, { status: 201 });
    }

    if (error?.code === "23505") {
      if (error.message.includes("restaurant_tables_number_unique")) {
        return NextResponse.json(
          { error: "A table with this number already exists" },
          { status: 409 },
        );
      }
      continue; // token collision -> retry with a fresh token
    }

    console.error("table_create_failed", error?.code);
    return NextResponse.json({ error: "Could not create the table" }, { status: 500 });
  }

  return NextResponse.json({ error: "Could not create the table" }, { status: 500 });
}

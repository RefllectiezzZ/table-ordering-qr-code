import QRCode from "qrcode";
import { TablesManager, type TableData } from "@/components/restaurant/tables-manager";
import { requireRestaurantOwner } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TableStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tables & QR codes" };

interface TableQueryRow {
  id: string;
  table_number: string;
  label: string | null;
  public_token: string;
  status: TableStatus;
  created_at: string;
}

export default async function TablesPage() {
  const session = await requireRestaurantOwner();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, label, public_token, status, created_at")
    .eq("restaurant_id", session.restaurantId)
    .order("created_at", { ascending: true });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // QR codes are rendered server-side (PNG data URLs) so the page needs no
  // client-side QR library and tokens stay out of third-party services.
  const tables: TableData[] = await Promise.all(
    ((data ?? []) as TableQueryRow[]).map(async (table) => {
      const url = `${appUrl}/t/${table.public_token}`;
      return {
        id: table.id,
        tableNumber: table.table_number,
        label: table.label,
        status: table.status,
        url,
        qrDataUrl: await QRCode.toDataURL(url, { width: 280, margin: 1 }),
      };
    }),
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Tables & QR codes</h1>
        <p className="text-sm text-slate-500">
          Each table gets a unique, non-guessable QR link. Print the QR code and place it on the
          table. Deactivating a table immediately blocks new orders from its QR code.
        </p>
      </div>
      <TablesManager tables={tables} />
    </div>
  );
}

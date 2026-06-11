import { notFound, redirect } from "next/navigation";
import { TableBillView } from "@/components/restaurant/table-bill-view";
import { requireRestaurantUser } from "@/lib/security/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveTableBill } from "@/server/table-bills";
import type { Language } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = { title: "Conta da mesa" };

export default async function TableBillPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const session = await requireRestaurantUser();
  const { tableId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("default_language, enable_table_sessions")
    .eq("id", session.restaurantId)
    .maybeSingle<{ default_language: Language; enable_table_sessions: boolean }>();

  if (!restaurant?.enable_table_sessions) {
    redirect("/restaurant/tables");
  }

  const result = await fetchActiveTableBill(
    supabase,
    session.restaurantId,
    tableId,
    restaurant.default_language ?? "pt",
  );

  if (!result.ok) {
    if (result.code === "table_not_found") notFound();
    redirect("/restaurant/tables");
  }

  if ("bill" in result) {
    const tableLabel = result.bill.tableLabel ?? `Mesa ${result.bill.tableNumber}`;
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-900">Conta da mesa</h1>
          <p className="text-sm text-slate-500">
            Resumo operacional dos pedidos confirmados — não é pagamento nem fatura.
          </p>
        </div>
        <TableBillView bill={result.bill} empty={false} tableLabel={tableLabel} />
      </div>
    );
  }

  const tableLabel = result.tableLabel ?? `Mesa ${result.tableNumber}`;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Conta da mesa</h1>
        <p className="text-sm text-slate-500">
          Resumo operacional dos pedidos confirmados — não é pagamento nem fatura.
        </p>
      </div>
      <TableBillView bill={null} empty tableLabel={tableLabel} />
    </div>
  );
}

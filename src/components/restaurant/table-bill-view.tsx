"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError } from "@/components/ui/form";
import { useApiAction } from "@/components/restaurant/use-api-action";
import { formatCentsToEuro } from "@/lib/money";
import type { TableBillPayload } from "@/server/table-bills";
import { formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_confirmation: "Por confirmar",
  new: "Novo",
  preparing: "A preparar",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
  rejected: "Rejeitado",
};

const STATUS_TONE: Record<
  OrderStatus,
  "red" | "yellow" | "green" | "neutral" | "blue" | "purple"
> = {
  pending_confirmation: "purple",
  new: "red",
  preparing: "yellow",
  ready: "green",
  delivered: "neutral",
  cancelled: "neutral",
  rejected: "neutral",
};

export function TableBillView({
  bill,
  empty,
  tableLabel,
}: {
  bill: TableBillPayload | null;
  empty: boolean;
  tableLabel: string;
}) {
  const router = useRouter();
  const { run, pending, error } = useApiAction();

  async function closeSession() {
    if (!bill) return;
    const message =
      "Fechar sessão não marca pagamento nem emite fatura. Use apenas quando a conta já foi tratada fora do sistema.\n\nFechar a sessão desta mesa?";
    if (!window.confirm(message)) return;

    const ok = await run(`/api/restaurant/table-sessions/${bill.sessionId}/close`, {
      force: false,
    });
    if (ok) {
      router.push("/restaurant/tables");
      return;
    }

    if (
      window.confirm(
        "Esta mesa ainda tem pedidos que não estão entregues/cancelados. Fechar mesmo assim?",
      )
    ) {
      const forced = await run(`/api/restaurant/table-sessions/${bill.sessionId}/close`, {
        force: true,
      });
      if (forced) router.push("/restaurant/tables");
    }
  }

  if (empty || !bill) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/restaurant/tables">
            <Button variant="outline" size="sm">
              Voltar às mesas
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
            Atualizar
          </Button>
        </div>
        <EmptyState
          title="Esta mesa não tem sessão aberta."
          description={`${tableLabel} não tem pedidos agrupados numa sessão ativa.`}
        />
        <FieldError message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4 print:max-w-none">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Link href="/restaurant/tables">
          <Button variant="outline" size="sm">
            Voltar às mesas
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
          Atualizar
        </Button>
        <div className="flex flex-col items-start gap-0.5">
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            Imprimir conta
          </Button>
          <span className="text-[10px] leading-snug text-slate-400">
            Impressão simples para apoio operacional. Não é documento fiscal.
          </span>
        </div>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => void closeSession()}>
          {pending ? "A fechar…" : "Fechar sessão"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conta da mesa — {tableLabel}</CardTitle>
          <p className="text-sm text-slate-500">
            Sessão aberta em {formatDateTime(bill.sessionOpenedAt)}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
            role="note"
          >
            <p>Esta conta é apenas um resumo operacional dos pedidos da sessão.</p>
            <p className="mt-1">Não processa pagamento. Não emite fatura.</p>
            <p className="mt-1">
              O pagamento e a fatura devem ser tratados fora do sistema, pelo método habitual do
              restaurante.
            </p>
          </div>

          {bill.orders.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ainda não há pedidos confirmados nesta sessão.
            </p>
          ) : (
            bill.orders.map((order) => (
              <div key={order.id} className="border-b border-slate-100 pb-4 last:border-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{order.displayNumber}</span>
                    <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</span>
                </div>
                <ul className="space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="text-slate-700">
                        {item.quantity}× {item.productName}
                        {item.itemNote ? (
                          <span className="block text-xs text-slate-400">{item.itemNote}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-slate-600">
                        {formatCentsToEuro(item.lineTotalCents)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm font-medium text-slate-800">
                  Total do pedido: {formatCentsToEuro(order.totalCents)}
                </p>
              </div>
            ))
          )}

          <div className="border-t border-slate-200 pt-4">
            <p className="text-right text-lg font-bold text-slate-900">
              Total da mesa: {formatCentsToEuro(bill.totalCents)}
            </p>
          </div>

          <p className="print:hidden text-xs leading-relaxed text-slate-500">
            Fechar sessão não marca pagamento nem emite fatura. Use apenas quando a conta já foi
            tratada fora do sistema.
          </p>
        </CardContent>
      </Card>

      <FieldError message={error} />
    </div>
  );
}

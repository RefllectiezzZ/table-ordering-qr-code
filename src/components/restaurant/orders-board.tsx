"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { nextStatuses, orderDisplayNumber } from "@/lib/orders";
import type { OrdersFilter, OrdersView } from "@/lib/orders-filters";
import { formatCentsToEuro } from "@/lib/money";
import { cn, formatDateTime, relativeTimePt } from "@/lib/utils";
import type { DashboardOrder } from "@/server/dashboard-orders";
import type { OrderStatus } from "@/types/database";

const POLL_INTERVAL_MS = 8000;

const STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "red" | "yellow" | "green" | "neutral" | "blue" | "purple" }
> = {
  pending_confirmation: { label: "Por confirmar", tone: "purple" },
  new: { label: "Novo", tone: "red" },
  preparing: { label: "A preparar", tone: "yellow" },
  ready: { label: "Pronto", tone: "green" },
  delivered: { label: "Entregue", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  rejected: { label: "Rejeitado", tone: "neutral" },
};

const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  pending_confirmation: "Por confirmar",
  new: "Novo",
  preparing: "Começar a preparar",
  ready: "Marcar pronto",
  delivered: "Marcar entregue",
  cancelled: "Cancelar",
  rejected: "Rejeitar",
};

const KITCHEN_COLUMNS: OrderStatus[] = ["new", "preparing", "ready"];
const HISTORY_STATUSES: OrderStatus[] = ["delivered", "cancelled", "rejected"];

const QUICK_FILTERS: { view: OrdersView; label: string }[] = [
  { view: "open", label: "Em curso" },
  { view: "pending", label: "Por confirmar" },
  { view: "today", label: "Hoje" },
  { view: "24h", label: "Últimas 24 h" },
  { view: "all", label: "Todos" },
];

function isoToLocalDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToLocalTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function FilterBar({ filter }: { filter: OrdersFilter }) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(filter.view === "custom");
  const [fromDate, setFromDate] = useState(isoToLocalDate(filter.fromIso));
  const [fromTime, setFromTime] = useState(isoToLocalTime(filter.fromIso));
  const [toDate, setToDate] = useState(isoToLocalDate(filter.toIso));
  const [toTime, setToTime] = useState(isoToLocalTime(filter.toIso));

  function applyView(view: OrdersView) {
    router.replace(view === "open" ? "/restaurant/orders" : `/restaurant/orders?view=${view}`);
  }

  function applyCustomRange(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ view: "custom" });
    if (fromDate) {
      const from = new Date(`${fromDate}T${fromTime || "00:00"}`);
      if (!Number.isNaN(from.getTime())) params.set("from", from.toISOString());
    }
    if (toDate) {
      const to = new Date(`${toDate}T${toTime || "23:59"}`);
      if (!Number.isNaN(to.getTime())) params.set("to", to.toISOString());
    }
    if (!params.has("from") && !params.has("to")) return;
    router.replace(`/restaurant/orders?${params.toString()}`);
  }

  const dateInputClasses =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900";

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro">
        {QUICK_FILTERS.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            onClick={() => applyView(view)}
            aria-pressed={filter.view === view}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter.view === view
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          aria-pressed={filter.view === "custom"}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            filter.view === "custom"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          Data e hora…
        </button>
      </div>

      {showCustom ? (
        <form onSubmit={applyCustomRange} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-600">
            De
            <div className="mt-1 flex gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={dateInputClasses}
              />
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className={dateInputClasses}
              />
            </div>
          </label>
          <label className="text-xs text-slate-600">
            Até
            <div className="mt-1 flex gap-1.5">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={dateInputClasses}
              />
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className={dateInputClasses}
              />
            </div>
          </label>
          <Button type="submit" size="sm">
            Aplicar período
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function OrderCard({
  order,
  fresh,
  busy,
  children,
}: {
  order: DashboardOrder;
  fresh?: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm",
        order.status === "new" && "border-red-300",
        order.status === "pending_confirmation" && "border-violet-300",
        order.status !== "new" && order.status !== "pending_confirmation" && "border-slate-200",
        fresh && "order-new-highlight",
        busy && "opacity-70",
      )}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold leading-tight text-slate-900">
            {order.tableLabel ?? `Mesa ${order.tableNumber}`}
          </p>
          <p className="text-sm font-semibold text-slate-700">
            Pedido {orderDisplayNumber(order.orderNumber, order.id)}
          </p>
          <p className="text-[11px] text-slate-400">
            {relativeTimePt(order.createdAt)} · {formatDateTime(order.createdAt)}
            {order.sessionOpenedAt ? (
              <> · sessão desde {formatDateTime(order.sessionOpenedAt)}</>
            ) : null}
          </p>
        </div>
        <Badge tone={STATUS_META[order.status].tone}>{STATUS_META[order.status].label}</Badge>
      </header>

      <ul className="mb-2 space-y-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm leading-snug">
            <span className="font-semibold text-slate-900">{item.quantity}×</span>{" "}
            <span className="text-slate-800">{item.productName}</span>
            {item.itemNote ? (
              <span className="block pl-5 text-xs italic text-slate-500">“{item.itemNote}”</span>
            ) : null}
          </li>
        ))}
      </ul>

      {order.customerNote ? (
        <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
          {order.customerNote}
        </p>
      ) : null}

      <p className="mb-3 text-sm font-semibold text-slate-700">
        {formatCentsToEuro(order.totalCents)}
      </p>

      {children}
    </article>
  );
}

/**
 * Order board: reception queue (pending confirmations) + kitchen columns
 * (new / preparing / ready, oldest first) + low-prominence history. Polls
 * GET /api/restaurant/orders with the current URL filter. Buttons disable
 * while a request is in flight so a double tap never fires twice.
 */
export function OrdersBoard({
  initialOrders,
  initialFilter,
}: {
  initialOrders: DashboardOrder[];
  initialFilter: OrdersFilter;
}) {
  const [orders, setOrders] = useState<DashboardOrder[]>(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pollError, setPollError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (initialFilter.view !== "open") params.set("view", initialFilter.view);
    if (initialFilter.fromIso) params.set("from", initialFilter.fromIso);
    if (initialFilter.toIso) params.set("to", initialFilter.toIso);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [initialFilter]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurant/orders${filterQuery}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setPollError(true);
        return;
      }
      const payload = (await response.json()) as { orders: DashboardOrder[] };
      setPollError(false);

      const incoming = payload.orders
        .filter(
          (o) =>
            (o.status === "new" || o.status === "pending_confirmation") &&
            !knownIdsRef.current.has(o.id),
        )
        .map((o) => o.id);
      payload.orders.forEach((o) => knownIdsRef.current.add(o.id));
      if (incoming.length > 0) {
        setFreshIds((current) => new Set([...current, ...incoming]));
      }
      setOrders(payload.orders);
    } catch {
      setPollError(true);
    }
  }, [filterQuery]);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  function clearFresh(orderId: string) {
    setFreshIds((current) => {
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }

  async function postAction(orderId: string, url: string, body?: unknown): Promise<boolean> {
    if (updating) return false;
    setUpdating(orderId);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      if (response.ok) {
        clearFresh(orderId);
        await refresh();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setUpdating(null);
    }
  }

  const updateStatus = (orderId: string, status: OrderStatus) =>
    postAction(orderId, `/api/restaurant/orders/${orderId}/status`, { status });

  const confirmOrder = (orderId: string) =>
    postAction(orderId, `/api/restaurant/orders/${orderId}/confirm`);

  function rejectOrder(orderId: string) {
    if (!window.confirm("Rejeitar este pedido? Não será preparado pela cozinha.")) return;
    void postAction(orderId, `/api/restaurant/orders/${orderId}/reject`);
  }

  const byOldest = (a: DashboardOrder, b: DashboardOrder) =>
    a.createdAt.localeCompare(b.createdAt);

  const pending = orders.filter((o) => o.status === "pending_confirmation").sort(byOldest);
  const kitchen = orders.filter((o) =>
    (KITCHEN_COLUMNS as string[]).includes(o.status),
  );
  const history = orders
    .filter((o) => (HISTORY_STATUSES as string[]).includes(o.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const isPendingOnly = initialFilter.view === "pending";

  if (orders.length === 0) {
    return (
      <div>
        <FilterBar filter={initialFilter} />
        <EmptyState
          title={
            initialFilter.view === "custom" || initialFilter.view === "today" || initialFilter.view === "24h"
              ? "Sem pedidos neste período"
              : initialFilter.view === "pending"
                ? "Sem pedidos por confirmar"
                : "Sem pedidos em aberto"
          }
          description="Os pedidos feitos pelos QR codes das mesas aparecem aqui automaticamente."
        />
      </div>
    );
  }

  return (
    <div>
      <FilterBar filter={initialFilter} />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          <strong className="text-slate-900">{kitchen.length}</strong> em cozinha
        </span>
        <span>
          <strong className={pending.length > 0 ? "text-violet-700" : "text-slate-900"}>
            {pending.length}
          </strong>{" "}
          por confirmar
        </span>
        {pollError ? (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Problema de ligação — a tentar novamente…
          </span>
        ) : null}
      </div>

      {/* Reception: pending confirmations */}
      <section aria-label="Por confirmar" className="mb-6">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
          Receção · por confirmar
          <span className="rounded-full bg-violet-100 px-1.5 text-[11px] text-violet-700">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-400">
            Sem pedidos por confirmar.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                fresh={freshIds.has(order.id)}
                busy={updating === order.id}
              >
                <p className="mb-3 rounded-lg bg-violet-50 p-2 text-xs text-violet-900">
                  Primeiro pedido deste dispositivo. Confirme que a mesa está mesmo ocupada
                  por estes clientes antes de enviar para a cozinha.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={updating === order.id}
                    onClick={() => void confirmOrder(order.id)}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={updating === order.id}
                    onClick={() => rejectOrder(order.id)}
                  >
                    Rejeitar
                  </Button>
                </div>
              </OrderCard>
            ))}
          </div>
        )}
      </section>

      {/* Kitchen board */}
      {!isPendingOnly ? (
        <section aria-label="Cozinha" className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cozinha · pedidos confirmados (mais antigos primeiro)
          </h2>
          {kitchen.length === 0 ? (
            <EmptyState
              title="Sem pedidos em aberto"
              description="Os pedidos confirmados aparecem aqui automaticamente."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {KITCHEN_COLUMNS.map((status) => {
                const columnOrders = kitchen
                  .filter((order) => order.status === status)
                  .sort(byOldest);
                return (
                  <section key={status} aria-label={STATUS_META[status].label}>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {STATUS_META[status].label}
                      <span className="rounded-full bg-slate-200 px-1.5 text-[11px] text-slate-600">
                        {columnOrders.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {columnOrders.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                          —
                        </p>
                      ) : (
                        columnOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            fresh={freshIds.has(order.id)}
                            busy={updating === order.id}
                          >
                            <div className="flex flex-wrap gap-2">
                              {nextStatuses(order.status).map((target) => (
                                <Button
                                  key={target}
                                  size="sm"
                                  variant={target === "cancelled" ? "outline" : "primary"}
                                  disabled={updating === order.id}
                                  onClick={() => void updateStatus(order.id, target)}
                                >
                                  {STATUS_ACTION_LABEL[target]}
                                </Button>
                              ))}
                            </div>
                          </OrderCard>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* History: low prominence */}
      {!isPendingOnly && history.length > 0 ? (
        <section aria-label="Histórico">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
          >
            Histórico · entregues / cancelados / rejeitados ({history.length})
            <span aria-hidden>{showHistory ? "▾" : "▸"}</span>
          </button>
          {showHistory ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {history.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      {order.tableLabel ?? `Mesa ${order.tableNumber}`}
                    </span>
                    <span className="text-slate-500">
                      Pedido {orderDisplayNumber(order.orderNumber, order.id)}
                    </span>
                    <Badge tone={STATUS_META[order.status].tone}>
                      {STATUS_META[order.status].label}
                    </Badge>
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(order.createdAt)} · {formatCentsToEuro(order.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

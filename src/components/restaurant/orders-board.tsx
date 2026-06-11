"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { nextStatuses, orderDisplayNumber } from "@/lib/orders";
import {
  ordersFilterQueryString,
  type OrderBoardView,
  type OrderRangeView,
  type OrdersFilter,
} from "@/lib/orders-filters";
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
const BOARD_TABS: { board: OrderBoardView; label: string }[] = [
  { board: "kitchen", label: "Cozinha" },
  { board: "staff", label: "Staff" },
  { board: "history", label: "Histórico" },
];

const RANGE_FILTERS: { range: OrderRangeView; label: string }[] = [
  { range: "open", label: "Em curso" },
  { range: "today", label: "Hoje" },
  { range: "24h", label: "Últimas 24 h" },
  { range: "all", label: "Todos" },
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

function FilterBar({
  filter,
  onBoardChange,
}: {
  filter: OrdersFilter;
  onBoardChange: (board: OrderBoardView) => void;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(filter.range === "custom");
  const [fromDate, setFromDate] = useState(isoToLocalDate(filter.fromIso));
  const [fromTime, setFromTime] = useState(isoToLocalTime(filter.fromIso));
  const [toDate, setToDate] = useState(isoToLocalDate(filter.toIso));
  const [toTime, setToTime] = useState(isoToLocalTime(filter.toIso));

  function navigate(next: OrdersFilter) {
    router.replace(`/restaurant/orders${ordersFilterQueryString(next)}`);
  }

  function applyRange(range: OrderRangeView) {
    navigate({ ...filter, range, fromIso: null, toIso: null });
  }

  function applyCustomRange(event: React.FormEvent) {
    event.preventDefault();
    const fromIso = fromDate
      ? new Date(`${fromDate}T${fromTime || "00:00"}`).toISOString()
      : null;
    const toIso = toDate
      ? new Date(`${toDate}T${toTime || "23:59"}`).toISOString()
      : null;
    if (!fromIso && !toIso) return;
    navigate({ ...filter, range: "custom", fromIso, toIso });
  }

  const dateInputClasses =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900";

  return (
    <div className="mb-5 space-y-3">
      <div
        className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-2"
        role="tablist"
        aria-label="Vista de pedidos"
      >
        {BOARD_TABS.map(({ board, label }) => (
          <button
            key={board}
            type="button"
            role="tab"
            aria-selected={filter.board === board}
            onClick={() => onBoardChange(board)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              filter.board === board
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Período">
          {RANGE_FILTERS.map(({ range, label }) => (
            <button
              key={range}
              type="button"
              onClick={() => applyRange(range)}
              aria-pressed={filter.range === range}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter.range === range
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
            aria-pressed={filter.range === "custom"}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter.range === "custom"
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
 * Order board with Kitchen / Staff / History tabs. Polls GET /api/restaurant/orders
 * with the current URL filter. Buttons disable while a request is in flight.
 */
export function OrdersBoard({
  initialOrders,
  initialFilter,
}: {
  initialOrders: DashboardOrder[];
  initialFilter: OrdersFilter;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<DashboardOrder[]>(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pollError, setPollError] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const filterQuery = useMemo(() => ordersFilterQueryString(initialFilter), [initialFilter]);

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

  function changeBoard(board: OrderBoardView) {
    router.replace(
      `/restaurant/orders${ordersFilterQueryString({ ...initialFilter, board })}`,
    );
  }

  const byOldest = (a: DashboardOrder, b: DashboardOrder) =>
    a.createdAt.localeCompare(b.createdAt);

  const pending = orders
    .filter((o) => o.status === "pending_confirmation")
    .sort(byOldest);
  const staffSecondary = orders
    .filter((o) => o.status === "rejected" || o.status === "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const kitchen = orders.filter((o) => (KITCHEN_COLUMNS as string[]).includes(o.status));
  const history = orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const board = initialFilter.board;

  const emptyTitle =
    board === "staff"
      ? "Sem pedidos por confirmar"
      : board === "history"
        ? "Sem pedidos no histórico"
        : initialFilter.range === "custom" ||
            initialFilter.range === "today" ||
            initialFilter.range === "24h"
          ? "Sem pedidos neste período"
          : "Sem pedidos para preparar";

  if (orders.length === 0) {
    return (
      <div>
        <FilterBar filter={initialFilter} onBoardChange={changeBoard} />
        <EmptyState
          title={emptyTitle}
          description={
            board === "kitchen"
              ? "A cozinha vê apenas pedidos confirmados."
              : board === "staff"
                ? "Confirme apenas se a mesa estiver realmente ocupada por estes clientes."
                : "Os pedidos entregues, cancelados e rejeitados aparecem aqui."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <FilterBar filter={initialFilter} onBoardChange={changeBoard} />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        {board === "kitchen" ? (
          <span>
            <strong className="text-slate-900">{kitchen.length}</strong> para preparar
          </span>
        ) : board === "staff" ? (
          <span>
            <strong className={pending.length > 0 ? "text-violet-700" : "text-slate-900"}>
              {pending.length}
            </strong>{" "}
            por confirmar
          </span>
        ) : (
          <span>
            <strong className="text-slate-900">{history.length}</strong> no histórico
          </span>
        )}
        {pollError ? (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Problema de ligação — a tentar novamente…
          </span>
        ) : null}
      </div>

      {board === "staff" ? (
        <section aria-label="Pedidos por confirmar" className="mb-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
            Pedidos por confirmar
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Confirme apenas se a mesa estiver realmente ocupada por estes clientes.
          </p>
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

          {staffSecondary.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Rejeitados / cancelados recentes
              </h3>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {staffSecondary.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">
                        {order.tableLabel ?? `Mesa ${order.tableNumber}`}
                      </span>
                      <Badge tone={STATUS_META[order.status].tone}>
                        {STATUS_META[order.status].label}
                      </Badge>
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {board === "kitchen" ? (
        <section aria-label="Pedidos para preparar" className="mb-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pedidos para preparar
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            A cozinha vê apenas pedidos confirmados.
          </p>
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

      {board === "history" ? (
        <section aria-label="Histórico">
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
        </section>
      ) : null}
    </div>
  );
}

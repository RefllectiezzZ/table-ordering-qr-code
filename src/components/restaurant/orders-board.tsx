"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { nextStatuses } from "@/lib/orders";
import { formatCentsToEuro } from "@/lib/money";
import { cn, formatDateTime, minutesSince } from "@/lib/utils";
import type { DashboardOrder } from "@/server/dashboard-orders";
import type { OrderStatus } from "@/types/database";

const POLL_INTERVAL_MS = 8000;

const STATUS_META: Record<OrderStatus, { label: string; tone: "red" | "yellow" | "green" | "neutral" | "blue" }> = {
  new: { label: "New", tone: "red" },
  preparing: { label: "Preparing", tone: "yellow" },
  ready: { label: "Ready", tone: "green" },
  delivered: { label: "Delivered", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Start preparing",
  ready: "Mark ready",
  delivered: "Mark delivered",
  cancelled: "Cancel",
};

const COLUMNS: OrderStatus[] = ["new", "preparing", "ready", "delivered", "cancelled"];

/**
 * Kitchen order board. Polls GET /api/restaurant/orders (simple + safe — no
 * websockets needed for MVP; Supabase Realtime is documented as follow-up).
 * Brand-new orders pulse visually; sound notification is a documented
 * follow-up because mobile browsers block audio without user interaction.
 */
export function OrdersBoard({ initialOrders }: { initialOrders: DashboardOrder[] }) {
  const [orders, setOrders] = useState<DashboardOrder[]>(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pollError, setPollError] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/restaurant/orders", { cache: "no-store" });
      if (!response.ok) {
        setPollError(true);
        return;
      }
      const payload = (await response.json()) as { orders: DashboardOrder[] };
      setPollError(false);

      const incomingNew = payload.orders
        .filter((o) => o.status === "new" && !knownIdsRef.current.has(o.id))
        .map((o) => o.id);
      payload.orders.forEach((o) => knownIdsRef.current.add(o.id));
      if (incomingNew.length > 0) {
        setFreshIds((current) => new Set([...current, ...incomingNew]));
      }
      setOrders(payload.orders);
    } catch {
      setPollError(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setFreshIds((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        setOrders((current) =>
          current.map((order) => (order.id === orderId ? { ...order, status } : order)),
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const openCount = orders.filter((o) => ["new", "preparing", "ready"].includes(o.status)).length;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="Orders submitted from table QR codes will appear here automatically."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 text-sm text-slate-500">
        <span>
          <strong className="text-slate-900">{openCount}</strong> open order
          {openCount === 1 ? "" : "s"}
        </span>
        {pollError ? (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Connection problem — retrying…
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((status) => {
          const columnOrders = orders.filter((order) => order.status === status);
          return (
            <section key={status} aria-label={STATUS_META[status].label}>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {STATUS_META[status].label}
                <span className="rounded-full bg-slate-200 px-1.5 text-[11px] text-slate-600">
                  {columnOrders.length}
                </span>
              </h2>
              <div className="space-y-3">
                {columnOrders.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                    —
                  </p>
                ) : (
                  columnOrders.map((order) => (
                    <article
                      key={order.id}
                      className={cn(
                        "rounded-xl border bg-white p-4 shadow-sm",
                        order.status === "new" ? "border-red-300" : "border-slate-200",
                        freshIds.has(order.id) && "order-new-highlight",
                      )}
                    >
                      <header className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {order.tableLabel ?? `Mesa ${order.tableNumber}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            #{order.shortCode} · {formatDateTime(order.createdAt)} ·{" "}
                            {minutesSince(order.createdAt)} min
                          </p>
                        </div>
                        <Badge tone={STATUS_META[order.status].tone}>
                          {STATUS_META[order.status].label}
                        </Badge>
                      </header>

                      <ul className="mb-2 space-y-1.5">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-sm leading-snug">
                            <span className="font-semibold text-slate-900">
                              {item.quantity}×
                            </span>{" "}
                            <span className="text-slate-800">{item.productName}</span>
                            {item.itemNote ? (
                              <span className="block pl-5 text-xs italic text-slate-500">
                                “{item.itemNote}”
                              </span>
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

                      <div className="flex flex-wrap gap-2">
                        {nextStatuses(order.status).map((target) => (
                          <Button
                            key={target}
                            size="sm"
                            variant={target === "cancelled" ? "outline" : "primary"}
                            disabled={updating === order.id}
                            onClick={() => updateStatus(order.id, target)}
                          >
                            {STATUS_ACTION_LABEL[target]}
                          </Button>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

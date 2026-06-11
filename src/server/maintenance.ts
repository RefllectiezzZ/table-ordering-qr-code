import "server-only";

import {
  CLEANUP_ORDER_STATUSES,
  retentionCutoffIso,
} from "@/lib/maintenance/orders-cleanup";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { logAudit } from "@/server/audit";

export interface OrdersCleanupPreview {
  retentionDays: number;
  cutoffIso: string;
  orderCount: number;
  orderItemCount: number;
  emptyClosedSessionCount: number;
}

export interface OrdersCleanupResult {
  deletedOrders: number;
  deletedOrderItems: number;
  deletedEmptySessions: number;
}

const BATCH_SIZE = 500;

/**
 * Counts terminal orders older than the retention cutoff. Non-terminal statuses
 * are excluded — they are never eligible for cleanup.
 */
export async function previewOrdersCleanup(
  retentionDays: number,
): Promise<OrdersCleanupPreview> {
  const supabase = createServiceRoleSupabaseClient();
  const cutoffIso = retentionCutoffIso(retentionDays);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .in("status", [...CLEANUP_ORDER_STATUSES])
    .lt("created_at", cutoffIso);

  if (error) {
    console.error("maintenance_cleanup_preview_orders_failed", error.code);
    throw new Error("preview_failed");
  }

  const orderIds = (orders ?? []).map((row) => row.id);
  let orderItemCount = 0;

  for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
    const batch = orderIds.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;
    const { count, error: itemsError } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .in("order_id", batch);
    if (itemsError) {
      console.error("maintenance_cleanup_preview_items_failed", itemsError.code);
      throw new Error("preview_failed");
    }
    orderItemCount += count ?? 0;
  }

  const emptyClosedSessionCount = await countEmptyClosedSessions(supabase, cutoffIso);

  return {
    retentionDays,
    cutoffIso,
    orderCount: orderIds.length,
    orderItemCount,
    emptyClosedSessionCount,
  };
}

/**
 * Deletes terminal orders older than the retention cutoff (order_items first).
 * Audit logs, restaurants, products and tables are never touched.
 */
export async function executeOrdersCleanup(
  retentionDays: number,
  actorUserId: string,
): Promise<OrdersCleanupResult> {
  const supabase = createServiceRoleSupabaseClient();
  const cutoffIso = retentionCutoffIso(retentionDays);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id")
    .in("status", [...CLEANUP_ORDER_STATUSES])
    .lt("created_at", cutoffIso);

  if (error) {
    console.error("maintenance_cleanup_execute_select_failed", error.code);
    throw new Error("execute_failed");
  }

  const orderIds = (orders ?? []).map((row) => row.id);
  let deletedOrderItems = 0;

  for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
    const batch = orderIds.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;

    const { count: itemCount, error: itemsError } = await supabase
      .from("order_items")
      .delete({ count: "exact" })
      .in("order_id", batch);
    if (itemsError) {
      console.error("maintenance_cleanup_execute_items_failed", itemsError.code);
      throw new Error("execute_failed");
    }
    deletedOrderItems += itemCount ?? 0;

    const { count: orderCount, error: ordersError } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .in("id", batch)
      .in("status", [...CLEANUP_ORDER_STATUSES])
      .lt("created_at", cutoffIso);
    if (ordersError) {
      console.error("maintenance_cleanup_execute_orders_failed", ordersError.code);
      throw new Error("execute_failed");
    }
    if ((orderCount ?? 0) !== batch.length) {
      console.error("maintenance_cleanup_execute_partial_delete");
      throw new Error("execute_failed");
    }
  }

  const deletedEmptySessions = await deleteEmptyClosedSessions(supabase, cutoffIso);

  await logAudit({
    actorUserId,
    action: "maintenance.orders_cleanup_executed",
    entityType: "orders",
    metadata: {
      retention_days: retentionDays,
      cutoff_iso: cutoffIso,
      deleted_orders: orderIds.length,
      deleted_order_items: deletedOrderItems,
      deleted_empty_sessions: deletedEmptySessions,
    },
  });

  return {
    deletedOrders: orderIds.length,
    deletedOrderItems,
    deletedEmptySessions,
  };
}

export async function logOrdersCleanupPreviewed(
  actorUserId: string,
  preview: OrdersCleanupPreview,
): Promise<void> {
  await logAudit({
    actorUserId,
    action: "maintenance.orders_cleanup_previewed",
    entityType: "orders",
    metadata: {
      retention_days: preview.retentionDays,
      cutoff_iso: preview.cutoffIso,
      order_count: preview.orderCount,
      order_item_count: preview.orderItemCount,
      empty_closed_session_count: preview.emptyClosedSessionCount,
    },
  });
}

type ServiceClient = ReturnType<typeof createServiceRoleSupabaseClient>;

async function countEmptyClosedSessions(
  supabase: ServiceClient,
  cutoffIso: string,
): Promise<number> {
  const { data: sessions, error } = await supabase
    .from("table_sessions")
    .select("id")
    .in("status", ["closed", "cancelled"])
    .lt("closed_at", cutoffIso);

  if (error || !sessions?.length) return 0;

  let emptyCount = 0;
  for (const session of sessions) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("table_session_id", session.id);
    if ((count ?? 0) === 0) emptyCount += 1;
  }
  return emptyCount;
}

async function deleteEmptyClosedSessions(
  supabase: ServiceClient,
  cutoffIso: string,
): Promise<number> {
  const { data: sessions, error } = await supabase
    .from("table_sessions")
    .select("id")
    .in("status", ["closed", "cancelled"])
    .lt("closed_at", cutoffIso);

  if (error || !sessions?.length) return 0;

  const deletable: string[] = [];
  for (const session of sessions) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("table_session_id", session.id);
    if ((count ?? 0) === 0) deletable.push(session.id);
  }

  if (deletable.length === 0) return 0;

  let deleted = 0;
  for (let i = 0; i < deletable.length; i += BATCH_SIZE) {
    const batch = deletable.slice(i, i + BATCH_SIZE);
    const { count, error: deleteError } = await supabase
      .from("table_sessions")
      .delete({ count: "exact" })
      .in("id", batch)
      .in("status", ["closed", "cancelled"]);
    if (deleteError) {
      console.error("maintenance_cleanup_execute_sessions_failed", deleteError.code);
      break;
    }
    deleted += count ?? 0;
  }
  return deleted;
}

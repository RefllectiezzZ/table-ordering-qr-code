import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

interface AuditEntry {
  restaurantId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  /** Keep minimal and safe: no secrets, no customer personal data. */
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit logging. Failures are swallowed (logged without details)
 * so auditing can never break a user-facing mutation.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    await supabase.from("audit_logs").insert({
      restaurant_id: entry.restaurantId ?? null,
      actor_user_id: entry.actorUserId ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch {
    console.error("audit_log_write_failed", entry.action);
  }
}

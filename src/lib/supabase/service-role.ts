import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * Hard rules:
 *  - This module must only ever be imported from server-only code
 *    (route handlers, server components, src/server). The "server-only"
 *    import above makes any client-side import a build-time error.
 *  - Never log the key. Never return it in any response.
 *  - Every query made with this client MUST be explicitly scoped
 *    (by QR token resolution or by a validated restaurant_id) because RLS
 *    will not protect you here.
 */
export function createServiceRoleSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

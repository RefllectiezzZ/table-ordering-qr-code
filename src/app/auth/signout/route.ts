import { NextResponse } from "next/server";
import { absoluteAppUrl } from "@/lib/app-url";
import { requireSameOrigin } from "@/lib/security/origin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Signs the current user out. Mutation -> POST only, same-origin only.
 *
 * The redirect target is built from NEXT_PUBLIC_APP_URL (never from
 * request.url, which can carry the wrong protocol behind proxies — the
 * "https://localhost:3000" bug). The target is a fixed app path, so there is
 * no open-redirect surface.
 */
export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(absoluteAppUrl("/"), { status: 303 });
}

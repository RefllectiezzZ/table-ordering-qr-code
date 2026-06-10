import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Safe liveness check. Returns no configuration details and no secrets. */
export async function GET() {
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}

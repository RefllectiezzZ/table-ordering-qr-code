import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

/** Post-login dispatcher: sends each role to its own area. */
export default async function DashboardDispatchPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  if (session.profile.role === "platform_admin") redirect("/admin");
  redirect("/restaurant");
}

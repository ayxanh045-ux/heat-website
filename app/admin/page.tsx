import { requireAdminUser } from "@/lib/admin-auth";
import { AdminShellClient } from "@/components/admin/admin-shell-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdminUser("/admin");
  return <AdminShellClient initialLoggedIn={Boolean(user)} />;
}

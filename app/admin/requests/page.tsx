import { requireAdminUser } from "@/lib/admin-auth";
import { AdminRequestsClient } from "@/components/admin/admin-requests-client";

export const dynamic = "force-dynamic";

export default async function EnergyAssessmentRequestsPage() {
  const user = await requireAdminUser("/admin/requests");
  return <AdminRequestsClient initialLoggedIn={Boolean(user)} />;
}

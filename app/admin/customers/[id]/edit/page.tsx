import { CustomerEditForm } from "@/components/admin/customer-edit-form";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function EditGate({ customerId }: { customerId: string }) {
  await requireAdminUser(`/admin/customers/${encodeURIComponent(customerId)}/edit`);
  return <CustomerEditForm customerId={customerId} />;
}

export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditGate customerId={id} />;
}

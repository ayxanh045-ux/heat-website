import { ShieldCheck } from "lucide-react";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { CustomerEditForm } from "@/components/admin/customer-edit-form";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function EditGate({ customerId }: { customerId: string }) {
  const user = await requireChatGPTUser(`/admin/customers/${encodeURIComponent(customerId)}/edit`);
  if (!isAdmin(user)) return <main className="admin-denied"><ShieldCheck size={44} /><h1>Bu bölməyə giriş yoxdur</h1><p>{user.email} admin allowlist-də deyil.</p><a href={chatGPTSignOutPath("/")}>Başqa hesabla daxil ol</a></main>;
  return <CustomerEditForm customerId={customerId} />;
}

export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditGate customerId={id} />;
}

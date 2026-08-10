import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { DeviceSetupForm } from "@/components/admin/device-setup-form";
import { isAdmin, isApprovedAdminDevice } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDeviceSetupPage({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  const user = await requireChatGPTUser("/admin/device-setup");
  if (!isAdmin(user)) return <main className="admin-denied"><h1>Bu bölməyə giriş yoxdur</h1><p>{user.email} admin allowlist-də deyil.</p><a href={chatGPTSignOutPath("/")}>Başqa hesabla daxil ol</a></main>;
  if (await isApprovedAdminDevice()) redirect("/admin");
  const requested = (await searchParams).return_to ?? "/admin";
  const returnTo = requested.startsWith("/admin") && !requested.startsWith("//") ? requested : "/admin";
  return <main className="admin-device-page"><DeviceSetupForm returnTo={returnTo} /></main>;
}

import { redirect } from "next/navigation";
import { CustomerAppLogin } from "@/components/customer-app-login";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function CustomerAppPage() {
  if (await getCustomerSession()) redirect("/app/dashboard");
  return <main className="customer-login-page"><CustomerAppLogin /><div className="customer-login-footer"><i /> Məlumatlar təhlükəsiz bağlantı ilə qorunur</div></main>;
}

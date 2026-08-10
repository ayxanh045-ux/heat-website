import { redirect } from "next/navigation";
import { CustomerAppLogin } from "@/components/customer-app-login";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage() {
  if (await getCustomerSession()) redirect("/customer/dashboard");
  return <main className="customer-login-page"><CustomerAppLogin /><div className="customer-login-footer"><i /> Bu giriş yalnız müştəri dashboardu üçündür</div></main>;
}

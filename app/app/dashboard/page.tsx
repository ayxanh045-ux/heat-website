import { redirect } from "next/navigation";
import { CustomerDashboard } from "@/components/admin/customer-dashboard";
import { CustomerAppShell } from "@/components/customer-app-shell";
import { getCustomerSession } from "@/lib/customer-auth";
import { bakuDateKey, DEMO_CUSTOMER } from "@/lib/demo-customer";

export const dynamic = "force-dynamic";

export default async function CustomerMobileDashboard() {
  const session = await getCustomerSession();
  if (!session) redirect("/app");
  return <main className="customer-app-page"><CustomerAppShell customerName={session.customerName} /><div className="customer-app-content"><CustomerDashboard customer={{ customerName: session.customerName, siteName: session.siteName, deviceName: session.deviceName, deviceId: session.deviceId, status: session.status, grafanaPort: session.grafanaPort }} dailyDemoDate={session.customerId === DEMO_CUSTOMER.id ? bakuDateKey() : undefined} customerView /></div></main>;
}

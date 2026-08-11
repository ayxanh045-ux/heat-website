import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { CustomerDashboard } from "@/components/admin/customer-dashboard";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";
import { getCustomerDisplayProfile } from "@/lib/customer-display-profile";
import { bakuDateKey, DEMO_CUSTOMER } from "@/lib/demo-customer";

export const dynamic = "force-dynamic";

async function CustomerDashboardGate({ customerId }: { customerId: string }) {
  const returnTo = `/admin/customers/${encodeURIComponent(customerId)}`;
  await requireAdminUser(returnTo);
  if (customerId === DEMO_CUSTOMER.id) {
    const profile = await getCustomerDisplayProfile(customerId);
    return <main className="customer-dashboard-page"><a className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Müştəri siyahısına qayıt</a><CustomerDashboard customer={DEMO_CUSTOMER} dailyDemoDate={bakuDateKey()} phaseLabels={profile.phaseLabels} hasAiContext={profile.hasAiContext} /></main>;
  }
  const [customer] = await getDb().select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) return <main className="customer-dashboard-page"><a className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Admin panelinə qayıt</a><div className="dashboard-not-found"><h1>Müştəri tapılmadı</h1><p>Bu qeyd silinib və ya ünvan düzgün deyil.</p></div></main>;
  const profile = await getCustomerDisplayProfile(customerId);
  return <main className="customer-dashboard-page"><a className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Müştəri siyahısına qayıt</a><CustomerDashboard customer={{ customerName: customer.customerName, siteName: customer.siteName, deviceName: customer.deviceName, deviceId: customer.deviceId, status: customer.status, grafanaPort: customer.grafanaPort }} phaseLabels={profile.phaseLabels} hasAiContext={profile.hasAiContext} /></main>;
}

export default async function CustomerDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDashboardGate customerId={id} />;
}

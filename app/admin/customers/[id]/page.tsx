import { eq } from "drizzle-orm";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { CustomerDashboard } from "@/components/admin/customer-dashboard";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { bakuDateKey, DEMO_CUSTOMER } from "@/lib/demo-customer";

export const dynamic = "force-dynamic";

async function CustomerDashboardGate({ customerId }: { customerId: string }) {
  const returnTo = `/admin/customers/${encodeURIComponent(customerId)}`;
  const user = await requireChatGPTUser(returnTo);
  if (!isAdmin(user)) return <main className="admin-denied"><ShieldCheck size={44} /><h1>Bu bölməyə giriş yoxdur</h1><p>{user.email} admin allowlist-də deyil.</p><a href={chatGPTSignOutPath("/")}>Başqa hesabla daxil ol</a></main>;
  if (customerId === DEMO_CUSTOMER.id) return <main className="customer-dashboard-page"><Link className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Müştəri siyahısına qayıt</Link><CustomerDashboard customer={DEMO_CUSTOMER} dailyDemoDate={bakuDateKey()} /></main>;
  const [customer] = await getDb().select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) return <main className="customer-dashboard-page"><Link className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Admin panelinə qayıt</Link><div className="dashboard-not-found"><h1>Müştəri tapılmadı</h1><p>Bu qeyd silinib və ya ünvan düzgün deyil.</p></div></main>;
  return <main className="customer-dashboard-page"><Link className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Müştəri siyahısına qayıt</Link><CustomerDashboard customer={{ customerName: customer.customerName, siteName: customer.siteName, deviceName: customer.deviceName, deviceId: customer.deviceId, status: customer.status, grafanaPort: customer.grafanaPort }} /></main>;
}

export default async function CustomerDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDashboardGate customerId={id} />;
}

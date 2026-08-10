import { desc, ne } from "drizzle-orm";
import { Activity, ExternalLink, LogOut, RefreshCw, Server, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { ProvisioningForm } from "@/components/admin/provisioning-form";
import { CustomerSecretsButton } from "@/components/admin/customer-secrets-button";
import { CustomerAppToken } from "@/components/admin/customer-app-token";
import { DemoMobileAccount } from "@/components/admin/demo-mobile-account";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  queued: "Növbədə", provisioning: "Qurulur", active: "Aktiv", failed: "Xəta",
};

async function CustomerList() {
  let rows: (typeof customers.$inferSelect)[] = [];
  let databaseReady = true;
  try { rows = await getDb().select().from(customers).where(ne(customers.id, DEMO_CUSTOMER.id)).orderBy(desc(customers.createdAt)).limit(50); }
  catch { databaseReady = false; }
  return <div className="customer-list-card">
    <div className="customer-list-head"><div><h2>Müştəri sistemləri</h2><p>Demo hesabı və son 50 real deployment.</p></div><a href="/admin"><RefreshCw size={15} /> Yenilə</a></div>
    {!databaseReady && <div className="admin-empty"><Server size={26} /><b>Real müştəri bazası müvəqqəti əlçatan deyil</b><span>Demo hesabı işləməyə davam edir.</span></div>}
    <div className="customer-table-wrap"><table><thead><tr><th>Müştəri</th><th>Cihaz</th><th>Rejim</th><th>Status</th><th>Giriş</th><th>Mobil tətbiq</th><th>Seyf</th></tr></thead><tbody>
      <tr className="demo-customer-row"><td><a className="customer-name-link" href={`/admin/customers/${DEMO_CUSTOMER.id}`}><b>{DEMO_CUSTOMER.customerName}</b><span>{DEMO_CUSTOMER.siteName}</span></a></td><td><code>{DEMO_CUSTOMER.deviceId}</code><span>{DEMO_CUSTOMER.deviceName}</span></td><td>Gündəlik demo</td><td><i className="status-pill demo">Demo aktivdir</i></td><td><a className="grafana-link" href={`/admin/customers/${DEMO_CUSTOMER.id}`}><ExternalLink size={14} /> Dashboard</a></td><td><DemoMobileAccount /></td><td><span>Demo məlumatları</span></td></tr>
      {rows.map((customer) => <tr key={customer.id}><td><a className="customer-name-link" href={`/admin/customers/${customer.id}`}><b>{customer.customerName}</b><span>{customer.siteName}</span></a></td><td><code>{customer.deviceId}</code><span>{customer.deviceName}</span></td><td>{customer.collectorMode}</td><td><i className={`status-pill ${customer.status}`}>{STATUS[customer.status] ?? customer.status}</i></td><td>{customer.status === "active" && customer.grafanaPort ? <a className="grafana-link" href={`http://localhost:${customer.grafanaPort}`}><ExternalLink size={14} /> Grafana</a> : <span>—</span>}</td><td><CustomerAppToken customerId={customer.id} customerName={customer.customerName} /></td><td><CustomerSecretsButton customerId={customer.id} customerName={customer.customerName} /></td></tr>)}
    </tbody></table></div>
  </div>;
}

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdmin(user)) return <main className="admin-denied"><ShieldCheck size={44} /><h1>Bu bölməyə giriş yoxdur</h1><p>{user.email} admin allowlist-də deyil.</p><a href={chatGPTSignOutPath("/")}>Başqa hesabla daxil ol</a></main>;
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link className="admin-brand" href="/"><span>H</span><div><b>HEAT</b><small>CONTROL PLANE</small></div></Link><nav><a className="active" href="/admin"><Activity size={17} /> Provisioning</a><a href="#customers"><Users size={17} /> Müştərilər</a></nav><div className="admin-user"><span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><b>{user.displayName}</b><small>{user.email}</small></div><a href={chatGPTSignOutPath("/")} aria-label="Çıxış"><LogOut size={16} /></a></div></aside>
    <main className="admin-main"><header><div><span className="admin-kicker">MULTI-TENANT ONBOARDING</span><h1>Yeni müştəri sistemi</h1><p>Məlumatları daxil edin — provisioner ayrıca və izolə edilmiş enerji monitorinq sistemi qursun.</p></div><div className="agent-state"><i /><span>Provisioner agent</span><b>Gözləyir</b></div></header><section id="customers"><CustomerList /></section><ProvisioningForm /></main>
  </div>;
}

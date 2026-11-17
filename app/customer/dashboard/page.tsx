import { CustomerDashboard } from "@/components/admin/customer-dashboard";
import { CustomerAppShell } from "@/components/customer-app-shell";
import { bakuDateKey, DEMO_CUSTOMER } from "@/lib/demo-customer";

export const dynamic = "force-dynamic";

export default async function CustomerPortalDashboard() {
  const customer = {
    customerName: DEMO_CUSTOMER.customerName,
    siteName: DEMO_CUSTOMER.siteName,
    deviceName: DEMO_CUSTOMER.deviceName,
    deviceId: DEMO_CUSTOMER.deviceId,
    status: DEMO_CUSTOMER.status,
    grafanaPort: DEMO_CUSTOMER.grafanaPort,
  };

  const phaseLabels: [string, string, string] = [
    "Zal + Kondisioner",
    "Mətbəx",
    "İşıqlandırma + Anbar",
  ];

  return (
    <main className="customer-app-page">
      <CustomerAppShell customerName={customer.customerName} />
      <div className="customer-app-content">
        <CustomerDashboard
          customer={customer}
          dailyDemoDate={bakuDateKey()}
          customerView
          phaseLabels={phaseLabels}
          hasAiContext
        />
      </div>
    </main>
  );
}

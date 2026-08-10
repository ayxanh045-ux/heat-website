export const DEMO_CUSTOMER = {
  id: "demo-caspian-coffee",
  customerName: "Caspian Coffee · DEMO",
  siteName: "Nizami filialı",
  deviceName: "Shelly Pro 3EM (virtual)",
  deviceId: "DEMO-3EM-001",
  status: "demo",
  grafanaPort: null,
} as const;

export const DEMO_EDIT_VALUES = {
  customerName: DEMO_CUSTOMER.customerName,
  customerSlug: "demo-caspian-coffee",
  siteName: DEMO_CUSTOMER.siteName,
  deviceName: DEMO_CUSTOMER.deviceName,
  deviceId: "demo3em001",
  deviceModel: "Shelly Pro 3EM",
  timezone: "Asia/Baku",
  collectorMode: "polling" as const,
  shellyServerUri: "https://demo.shelly.cloud",
  shellyCloudAuthKey: "demo-cloud-key-not-real",
  influxOrg: "HEAT",
  influxBucket: "energy",
  influxAdminUsername: "heat-admin",
  influxAdminPassword: "HeatDotdc4539@",
  influxAdminToken: "demo-influx-token-not-real",
  grafanaAdminUsername: "admin",
  grafanaAdminPassword: "HeatDotdc4539#",
  telegramEnabled: false,
};

export function bakuDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

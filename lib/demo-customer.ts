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

export function demoDailyMetrics(dateKey = bakuDateKey()) {
  let seed = 2166136261;
  for (const char of dateKey) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const [year, month, day] = dateKey.split("-").map(Number);
  const completedDays = Math.max(1, day - 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totals = Array.from({ length: completedDays }, (_, index) => {
    const weekday = new Date(Date.UTC(year, month - 1, index + 1)).getUTCDay();
    const busyDay = weekday === 5 || weekday === 6 ? 10 : weekday === 0 ? -7 : 0;
    return 78 + busyDay + (random() - 0.5) * 16;
  });
  const latestEnergy = totals.at(-1) ?? 80;
  const actualEnergy = totals.reduce((sum, value) => sum + value, 0);
  const projectedKwh = actualEnergy + latestEnergy * (daysInMonth - completedDays);
  return {
    dateKey,
    powerKw: (5.7 + random() * 1.9).toFixed(2),
    latestEnergyKwh: latestEnergy.toFixed(1),
    projectedKwh: Math.round(projectedKwh).toLocaleString("en-US"),
    projectedCostAzn: (projectedKwh * 0.11).toFixed(2),
  };
}

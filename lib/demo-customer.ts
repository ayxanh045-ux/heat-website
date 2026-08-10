export const DEMO_CUSTOMER = {
  id: "demo-caspian-coffee",
  customerName: "Caspian Coffee · DEMO",
  siteName: "Nizami filialı",
  deviceName: "Shelly Pro 3EM (virtual)",
  deviceId: "DEMO-3EM-001",
  status: "demo",
  grafanaPort: null,
} as const;

export function bakuDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

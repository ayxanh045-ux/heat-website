export type SystemHealthRow = {
  customerId: string;
  customerName: string;
  siteName: string;
  customerStatus: string;
  healthStatus: string | null;
  statusMessage: string | null;
  lastHeartbeatAt: string | null;
};

export const ADMIN_DIGEST_TIMES = ["00:00", "12:00"] as const;

export function buildAdminHealthDigest(rows: SystemHealthRow[], now: Date, scheduledTime: string): string {
  const staleBefore = now.getTime() - 15 * 60_000;
  const evaluated = rows.map((row) => {
    const heartbeat = row.lastHeartbeatAt ? new Date(row.lastHeartbeatAt).getTime() : 0;
    const stale = row.customerStatus !== "demo" && (!heartbeat || heartbeat < staleBefore);
    const health = stale ? "stale" : row.customerStatus === "demo" ? "healthy" : row.healthStatus ?? "unknown";
    return { ...row, health };
  });
  const healthy = evaluated.filter(row => row.health === "healthy").length;
  const problems = evaluated.length - healthy;
  const lines = evaluated.map(row => {
    const icon = row.health === "healthy" ? "✅" : row.health === "degraded" ? "⚠️" : "❌";
    const label = row.health === "healthy" ? "İşləkdir" : row.health === "degraded" ? "Zəif işləyir" : row.health === "stale" ? "Əlaqə köhnəlib" : row.health === "unhealthy" ? "Problem var" : "Məlumat yoxdur";
    return `${icon} ${row.customerName} · ${row.siteName}: ${label}${row.health !== "healthy" && row.statusMessage ? ` — ${row.statusMessage.slice(0, 120)}` : ""}`;
  });
  const local = new Intl.DateTimeFormat("az-AZ", {
    timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
  return `🛡 HEAT Admin — Avtomatik durum analizi\n\nPlanlaşdırılan vaxt: ${scheduledTime} (Bakı vaxtı)\nYoxlama vaxtı: ${local}\n\nÜmumi sistem: ${evaluated.length}\n✅ İşlək: ${healthy}\n${problems ? "⚠️" : "✅"} Diqqət tələb edən: ${problems}\n\n${lines.length ? lines.join("\n") : "ℹ️ Hələ müştəri sistemi əlavə edilməyib."}\n\nBu mesaj hər gün saat 00:00 və 12:00-da avtomatik göndərilir.`;
}

import type { ProvisioningInput } from "@/lib/provisioning";
import { demoOperationalMetrics } from "@/lib/demo-customer";

export const TELEGRAM_COMMANDS = [
  { command: "start", description: "HEAT botunu aç" },
  { command: "status", description: "Hazırkı enerji statusu" },
  { command: "report", description: "Ətraflı enerji hesabatı" },
  { command: "last24h", description: "Son 24 saatın hesabatı" },
  { command: "devices", description: "Qoşulmuş cihazlar" },
  { command: "help", description: "Komandaları göstər" },
] as const;

export function allowedTelegramChatIds(values: ProvisioningInput): string[] {
  return (values.telegramAllowedChatIds ?? "").split(",").map((id) => id.trim()).filter(Boolean);
}

export async function telegramWebhookSecret(botToken: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`heat-webhook:${botToken}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function safeEqual(left: string, right: string): Promise<boolean> {
  const encode = (value: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const [leftHash, rightHash] = await Promise.all([encode(left), encode(right)]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export async function callTelegram<T extends { ok?: boolean; description?: string }>(
  botToken: string,
  method: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json() as T;
  if (!response.ok || !result.ok) throw new Error(result.description || "Telegram sorğunu qəbul etmədi.");
  return result;
}

export function demoTelegramReply(command: string, values: ProvisioningInput): string {
  const metrics = demoOperationalMetrics();
  const help = `🧭 HEAT — Komanda menyusu\n\n/status\nAni güc, fazalar, gərginlik və sistem vəziyyəti.\n\n/report\nBugünkü, aylıq və maliyyə göstəriciləri ilə tam hesabat.\n\n/last24h\nSon 24 saatın vaxt aralıqları, pik nöqtəsi və əvvəlki günlə müqayisəsi.\n\n/devices\nShelly cihazı, bağlantı və məlumat axınının texniki vəziyyəti.\n\nMəlumatlar yalnız siz istəyəndə göndərilir.`;
  if (command === "/start") {
    return `👋 HEAT enerji botuna xoş gəlmisiniz\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\n\n✅ Sistem işləyir\n⚡ Hazırkı güc: ${metrics.powerKw} kW\n🕒 Son yenilənmə: ${metrics.time}\n\nƏtraflı baxmaq üçün /status yazın. Bütün seçimlər üçün /help yazın.`;
  }
  if (command === "/help") return help;
  if (command === "/status") {
    return `✅ HEAT — Canlı vəziyyət\n\n🏢 ${values.siteName}\n🕒 Ölçü vaxtı: ${metrics.time}\n\n⚡ Ümumi güc: ${metrics.powerKw} kW\n• Faza A: ${metrics.phasePowersKw[0]} kW · ${metrics.phaseVoltagesV[0]} V · ${metrics.phaseCurrentsA[0]} A\n• Faza B: ${metrics.phasePowersKw[1]} kW · ${metrics.phaseVoltagesV[1]} V · ${metrics.phaseCurrentsA[1]} A\n• Faza C: ${metrics.phasePowersKw[2]} kW · ${metrics.phaseVoltagesV[2]} V · ${metrics.phaseCurrentsA[2]} A\n\n🔋 Bu gün: ${metrics.todayEnergyKwh} kWh\n📡 Məlumat axını: Aktiv\n🟢 Qiymətləndirmə: Normal\n\nHeç bir kritik yük və ya faza balanssızlığı aşkarlanmayıb.`;
  }
  if (command === "/devices") {
    return `🔌 HEAT — Cihaz və bağlantı\n\n🏢 Obyekt: ${values.siteName}\n📟 Cihaz: ${values.deviceName}\n🆔 Device ID: ${values.deviceId}\n🧩 Model: ${values.deviceModel}\n\n☁️ Shelly Cloud: Qoşulub\n📡 Siqnal: ${metrics.signalDbm} dBm · Yaxşı\n⏱ Fasiləsiz iş: ${metrics.uptimeDays} gün\n📥 InfluxDB məlumat axını: Aktiv\n📊 Dashboard: Hazırdır\n🔔 Telegram xəbərdarlıqları: Aktiv\n\nSon məlumat: bu gün ${metrics.time}`;
  }
  if (command === "/report") {
    return `📊 HEAT — Ətraflı enerji hesabatı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nTarix: ${metrics.dateKey}\n\nBUGÜN\n⚡ Hazırkı güc: ${metrics.powerKw} kW\n🔋 Bu gün indiyədək: ${metrics.todayEnergyKwh} kWh\n📅 Son tamamlanmış gün: ${metrics.latestEnergyKwh} kWh\n\nBU AY\n📈 İndiyədək sərfiyyat: ${metrics.actualEnergyKwh} kWh\n📊 Günlük orta: ${metrics.averageDailyKwh} kWh\n💳 İndiyədək hesablanan xərc: ${metrics.monthActualCostAzn} AZN\n🔮 Ay sonu proqnozu: ${metrics.projectedKwh} kWh · ${metrics.projectedCostAzn} AZN\n\n💡 HEAT tövsiyəsi\nİstehlak normal diapazondadır. Pik saatlarda çay aparatı və digər yüksək güclü cihazları eyni anda işə salmamaq aylıq xərci azaltmağa kömək edə bilər.`;
  }
  if (command === "/last24h") {
    const direction = Number(metrics.changePercent) >= 0 ? "artıb" : "azalıb";
    return `🕘 HEAT — Son 24 saat\n\n🏢 ${values.siteName}\n📅 ${metrics.dateKey}\n\nSAAT ARALIQLARI\n00:00–06:00  ${metrics.blockEnergyKwh[0]} kWh\n06:00–12:00  ${metrics.blockEnergyKwh[1]} kWh\n12:00–18:00  ${metrics.blockEnergyKwh[2]} kWh\n18:00–24:00  ${metrics.blockEnergyKwh[3]} kWh\n\n🔋 Cəmi: ${metrics.latestEnergyKwh} kWh\n⚡ Orta güc: ${metrics.averagePowerKw} kW\n🔺 Pik güc: ${metrics.peakPowerKw} kW · saat ${metrics.peakTime}\n\nMÜQAYİSƏ\nƏvvəlki 24 saat: ${metrics.previous24hKwh} kWh\nİstehlak ${Math.abs(Number(metrics.changePercent)).toFixed(1)}% ${direction}.\n\n${Number(metrics.changePercent) > 5 ? "⚠️ Artım var. Pik saatdakı cihazları yoxlamaq faydalıdır." : "✅ Kəskin dəyişiklik aşkarlanmayıb."}`;
  }
  return `Bu komanda tanınmadı.\n\n${help}`;
}

import type { ProvisioningInput } from "@/lib/provisioning";
import { demoDailyMetrics } from "@/lib/demo-customer";

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
  const metrics = demoDailyMetrics();
  const help = `👋 HEAT enerji botu\n\nMəlumatınızı istədiyiniz vaxt bu komandalarla görə bilərsiniz:\n/status — hazırkı vəziyyət\n/report — ətraflı hesabat\n/last24h — son 24 saat\n/devices — cihaz məlumatı\n/help — komandalar`;
  if (command === "/start" || command === "/help") return help;
  if (command === "/status") {
    return `✅ HEAT — Hazırkı status\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\n⚡ Güc: ${metrics.powerKw} kW\n🔋 Son tamamlanmış gün: ${metrics.latestEnergyKwh} kWh\n💰 Aylıq proqnoz: ${metrics.projectedCostAzn} AZN\n\nStatus: Normal`;
  }
  if (command === "/devices") {
    return `🔌 HEAT — Qoşulmuş cihaz\n\nObyekt: ${values.siteName}\nCihaz: ${values.deviceName}\nDevice ID: ${values.deviceId}\nBağlantı: Aktiv`;
  }
  if (command === "/report" || command === "/last24h") {
    const title = command === "/last24h" ? "Son 24 saatın enerji hesabatı" : "Ətraflı enerji hesabatı";
    return `📊 HEAT — ${title}\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nTarix: ${metrics.dateKey}\n\n⚡ Hazırkı güc: ${metrics.powerKw} kW\n🔋 Son tamamlanmış gün: ${metrics.latestEnergyKwh} kWh\n💰 Aylıq proqnoz: ${metrics.projectedCostAzn} AZN (${metrics.projectedKwh} kWh)\n\n✅ Status: Normal\n💡 Tövsiyə: İstehlak normaldır. Hazırda müdaxilə tələb olunmur.`;
  }
  return `Bu komanda tanınmadı.\n\n${help}`;
}

import type { ProvisioningInput } from "@/lib/provisioning";
import { demoOperationalMetrics } from "@/lib/demo-customer";

const ANALYTICS_NOTICE = "ℹ️ Qeyd: Bu, avtomatik ölçmə və analitikaya əsaslanan ilkin məlumatdır. Qəti diaqnoz deyil; qərardan əvvəl göstəriciləri yerində və lazım olduqda ixtisaslı mütəxəssislə yoxlayın.";

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
    return `✅ HEAT — Canlı vəziyyət\n\n🏢 ${values.siteName}\n🕒 Ölçü vaxtı: ${metrics.time}\n\n⚡ Ümumi güc: ${metrics.powerKw} kW\n• Faza A: ${metrics.phasePowersKw[0]} kW · ${metrics.phaseVoltagesV[0]} V · ${metrics.phaseCurrentsA[0]} A\n• Faza B: ${metrics.phasePowersKw[1]} kW · ${metrics.phaseVoltagesV[1]} V · ${metrics.phaseCurrentsA[1]} A\n• Faza C: ${metrics.phasePowersKw[2]} kW · ${metrics.phaseVoltagesV[2]} V · ${metrics.phaseCurrentsA[2]} A\n\n🔋 Bu gün: ${metrics.todayEnergyKwh} kWh\n📡 Məlumat axını: Aktiv\n🟢 İlkin qiymətləndirmə: Normal diapazona yaxındır\n\nHazırkı ölçümlərdə nəzərəçarpan kritik dəyişiklik görünmür.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/devices") {
    return `🔌 HEAT — Cihaz və bağlantı\n\n🏢 Obyekt: ${values.siteName}\n📟 Cihaz: ${values.deviceName}\n🆔 Device ID: ${values.deviceId}\n🧩 Model: ${values.deviceModel}\n\n☁️ Shelly Cloud: Qoşulub\n📡 Siqnal: ${metrics.signalDbm} dBm · Yaxşı\n⏱ Fasiləsiz iş: ${metrics.uptimeDays} gün\n📥 InfluxDB məlumat axını: Aktiv\n📊 Dashboard: Hazırdır\n🔔 Telegram xəbərdarlıqları: Aktiv\n\nSon məlumat: bu gün ${metrics.time}`;
  }
  if (command === "/report") {
    return `📊 HEAT — Ətraflı enerji hesabatı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nTarix: ${metrics.dateKey}\n\nÜMUMİ GÖSTƏRİCİLƏR\n⚡ Hazırkı ümumi güc: ${metrics.powerKw} kW\n🔋 Bu gün indiyədək: ${metrics.todayEnergyKwh} kWh\n📅 Son tamamlanmış 24 saat: ${metrics.latestEnergyKwh} kWh\n\nFAZALAR — CANLI GÜC\nA: ${metrics.phasePowersKw[0]} kW · ${metrics.phaseVoltagesV[0]} V · ${metrics.phaseCurrentsA[0]} A\nB: ${metrics.phasePowersKw[1]} kW · ${metrics.phaseVoltagesV[1]} V · ${metrics.phaseCurrentsA[1]} A\nC: ${metrics.phasePowersKw[2]} kW · ${metrics.phaseVoltagesV[2]} V · ${metrics.phaseCurrentsA[2]} A\n\nFAZALAR — SON 24 SAAT ENERJİ\nA: ${metrics.phaseEnergyKwh[0]} kWh · ümuminin ${metrics.phaseSharesPct[0]}%-i\nB: ${metrics.phaseEnergyKwh[1]} kWh · ümuminin ${metrics.phaseSharesPct[1]}%-i\nC: ${metrics.phaseEnergyKwh[2]} kWh · ümuminin ${metrics.phaseSharesPct[2]}%-i\nCəm: ${metrics.latestEnergyKwh} kWh\n\nBU AY\n📈 İndiyədək sərfiyyat: ${metrics.actualEnergyKwh} kWh\n📊 Günlük orta: ${metrics.averageDailyKwh} kWh\n💳 Təxmini cari xərc: ${metrics.monthActualCostAzn} AZN\n🔮 Təxmini ay sonu proqnozu: ${metrics.projectedKwh} kWh · ${metrics.projectedCostAzn} AZN\n\n💡 Mümkün optimallaşdırma\nƏn çox yük hazırda Faza A-dadır. Pik saatlarda yüksək güclü cihazları fərqli vaxtlarda işlətmək sərfiyyatı və fazalar arasındakı fərqi azaltmağa kömək edə bilər. Nəticə iş rejimindən asılıdır.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/last24h") {
    const direction = Number(metrics.changePercent) >= 0 ? "artıb" : "azalıb";
    return `🕘 HEAT — Son 24 saat\n\n🏢 ${values.siteName}\n📅 ${metrics.dateKey}\n\nSAAT ARALIQLARI\n00:00–06:00  ${metrics.blockEnergyKwh[0]} kWh\n06:00–12:00  ${metrics.blockEnergyKwh[1]} kWh\n12:00–18:00  ${metrics.blockEnergyKwh[2]} kWh\n18:00–24:00  ${metrics.blockEnergyKwh[3]} kWh\n\nFAZALAR\nA: ${metrics.phaseEnergyKwh[0]} kWh · hazırda ${metrics.phasePowersKw[0]} kW\nB: ${metrics.phaseEnergyKwh[1]} kWh · hazırda ${metrics.phasePowersKw[1]} kW\nC: ${metrics.phaseEnergyKwh[2]} kWh · hazırda ${metrics.phasePowersKw[2]} kW\n\n🔋 Ümumi enerji: ${metrics.latestEnergyKwh} kWh\n⚡ Hazırkı ümumi güc: ${metrics.powerKw} kW\n⚡ 24 saatlıq orta güc: ${metrics.averagePowerKw} kW\n🔺 Ölçülən ən yüksək güc: ${metrics.peakPowerKw} kW · saat ${metrics.peakTime}\n\nMÜQAYİSƏ\nƏvvəlki 24 saat: ${metrics.previous24hKwh} kWh\nHesablamaya görə istehlak təxminən ${Math.abs(Number(metrics.changePercent)).toFixed(1)}% ${direction}.\n\n${Number(metrics.changePercent) > 5 ? "⚠️ Artım ehtimalı görünür. Pik saatdakı cihazları yerində yoxlamaq faydalı ola bilər." : "✅ Ölçümlərdə kəskin dəyişiklik görünmür."}\n\n${ANALYTICS_NOTICE}`;
  }
  return `Bu komanda tanınmadı.\n\n${help}`;
}

export function demoTelegramAlert(kind: "peak" | "anomaly", values: ProvisioningInput): string {
  const metrics = demoOperationalMetrics();
  if (kind === "peak") {
    const peak = Number(metrics.peakPowerKw);
    const phaseA = (peak * 0.45).toFixed(2);
    const phaseB = (peak * 0.32).toFixed(2);
    const phaseC = (peak * 0.23).toFixed(2);
    return `⚠️ HEAT — Yüksək güc ehtimalı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nÖlçü vaxtı: ${metrics.peakTime}\n\n🔺 Ölçülən ümumi güc: ${peak.toFixed(2)} kW\n• Faza A: ${phaseA} kW\n• Faza B: ${phaseB} kW\n• Faza C: ${phaseC} kW\n📏 Təyin edilmiş müqayisə həddi: 9.50 kW\n📈 Həddən fərq: ${(peak - 9.5).toFixed(2)} kW\n\nMümkün izah:\nBir neçə yüksək güclü cihazın eyni vaxtda işləməsi bu göstəriciyə səbəb ola bilər. Başqa səbəblər də mümkündür.\n\n💡 Ehtiyatlı addım:\nTəhlükəsizdirsə, məsul şəxs cihazların iş rejimini yerində yoxlaya və yükün növbəti ölçümlərdə davam edib-etmədiyini izləyə bilər. Elektrik müdaxiləsini yalnız ixtisaslı şəxs etməlidir.\n\n🟠 İlkin status: Yoxlama tövsiyə olunur\n\n${ANALYTICS_NOTICE}`;
  }
  const anomalyPower = 6.1;
  const normalNightPower = 1.27;
  return `🚨 HEAT — Qeyri-adi göstərici ehtimalı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nÖlçü vaxtı: 01:42\n\n⚡ Faza A ölçümü: ${anomalyPower.toFixed(2)} kW\n📉 Müqayisə üçün gecə bazası: ${normalNightPower.toFixed(2)} kW\n📈 Fərq: təxminən ${(anomalyPower / normalNightPower).toFixed(1)} dəfə\n⏱ Müşahidə müddəti: 18 dəqiqə\n💸 Hesablanan əlavə sərfiyyat: təxminən 1.83 kWh\n\nMümkün izahlar:\nCihazın açıq qalması, iş rejiminin dəyişməsi, ölçmə rabitəsində keçici problem və ya başqa texniki səbəb ola bilər.\n\n🔎 Tövsiyə olunan yoxlama:\n1. Təhlükəsizdirsə, məsul şəxs cihazların vəziyyətini yerində yoxlaya bilər.\n2. Göstərici davam edərsə, ixtisaslı elektrik mütəxəssisinin yoxlaması məqsədəuyğundur.\n3. Tək bir avtomatik bildiriş əsasında elektrik xəttinə müdaxilə edilməməlidir.\n\n🔴 İlkin status: Əlavə yoxlama tövsiyə olunur\n\n${ANALYTICS_NOTICE}`;
}

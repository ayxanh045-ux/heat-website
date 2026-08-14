import type { ProvisioningInput } from "@/lib/provisioning";
import { bakuDateKey, demoEnergyForDate, demoOperationalMetrics, demoPeriodRows } from "@/lib/demo-customer";
import type { EnergySettings } from "@/lib/customer-insights";

const ANALYTICS_NOTICE = "ℹ️ Qeyd: Bu, avtomatik ölçmə və analitikaya əsaslanan ilkin məlumatdır. Qəti diaqnoz deyil; qərardan əvvəl göstəriciləri yerində və lazım olduqda ixtisaslı mütəxəssislə yoxlayın.";

export const TELEGRAM_COMMANDS = [
  { command: "start", description: "HEAT botunu aç" },
  { command: "status", description: "Hazırkı enerji statusu" },
  { command: "report", description: "Ətraflı enerji hesabatı" },
  { command: "last24h", description: "Son 24 saatın hesabatı" },
  { command: "day", description: "Seçilmiş gün: /day YYYY-MM-DD" },
  { command: "weekly", description: "Son 7 günün cədvəli" },
  { command: "monthly", description: "Ayın günlər üzrə cədvəli" },
  { command: "devices", description: "Qoşulmuş cihazlar" },
  { command: "savings", description: "Qənaət göstəricisi" },
  { command: "budget", description: "Aylıq büdcə vəziyyəti" },
  { command: "setbudget", description: "Büdcəni dəyiş: /setbudget 750" },
  { command: "compare", description: "Dövr müqayisələri" },
  { command: "afterhours", description: "İş saatından sonrakı itki" },
  { command: "sethours", description: "İş saatlarını dəyiş: /sethours 09:00 23:00" },
  { command: "peaks", description: "Pik saatlar və güc" },
  { command: "score", description: "Enerji performans balı" },
  { command: "recommendations", description: "Qənaət tövsiyələri" },
  { command: "contact", description: "HEAT ilə əlaqə" },
  { command: "help", description: "Komandaları göstər" },
] as const;

export function allowedTelegramChatIds(values: ProvisioningInput): string[] {
  return (values.telegramAllowedChatIds ?? "").split(",").map((id) => id.trim()).filter(Boolean);
}

function phaseNames(values: ProvisioningInput): [string, string, string] {
  return [values.phaseALabel, values.phaseBLabel, values.phaseCLabel];
}

function phaseTitle(letter: "A" | "B" | "C", name: string): string {
  return name.toLocaleLowerCase("az").replace(/\s+/g, " ") === `faza ${letter.toLowerCase()}`
    ? `Faza ${letter}`
    : `Faza ${letter} — ${name}`;
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

export function demoTelegramReply(command: string, values: ProvisioningInput, options: { automatic?: boolean; parameter?: string; energySettings?: Partial<EnergySettings> } = {}): string {
  const metrics = demoOperationalMetrics();
  const phases = phaseNames(values);
  const tariff = values.electricityTariffAznPerKwh;
  const phaseCosts = metrics.phaseEnergyKwh.map((value) => (Number(value) * tariff).toFixed(2));
  const total24hCost = (Number(metrics.latestEnergyKwh) * tariff).toFixed(2);
  const monthActualCost = (Number(metrics.actualEnergyKwh) * tariff).toFixed(2);
  const projectedCost = (Number(metrics.projectedKwh.replace(/,/g, "")) * tariff).toFixed(2);
  const automaticHeader = options.automatic
    ? `🤖 AVTOMATİK REPORT\n📅 Göndərilmə planı: gündə ${values.telegramReportCount} dəfə\n🕒 Saatlar: ${values.telegramReportTimes.split(",").join(" · ")} (${values.timezone})\n\n`
    : "";
  const normalizedText = command.trim().toLocaleLowerCase("az");
  if (!normalizedText.startsWith("/")) {
    if (/(bu ay|aylıq).*(xərc|xerc|ödəniş|odenish|hesab)|(xərc|xerc|hesab).*(bu ay|aylıq)/.test(normalizedText)) return `💳 Bu ay indiyədək xərc: ${monthActualCost} AZN`;
    if (/(bu gün|bugün|bugun).*(xərc|xerc)|(xərc|xerc).*(bu gün|bugün|bugun)/.test(normalizedText)) return `💳 Bu gün xərc: ${(Number(metrics.todayEnergyKwh) * tariff).toFixed(2)} AZN`;
    if (/(bu gün|bugün|bugun).*(sərfiyyat|serfiyyat|enerji|kwh)|(sərfiyyat|serfiyyat|enerji).*(bu gün|bugün|bugun)/.test(normalizedText)) return `⚡ Bu gün enerji sərfiyyatı: ${metrics.todayEnergyKwh} kWh`;
    if (/(hazırkı|hazirki|indi).*(güc|guc)|(güc|guc).*(hazırkı|hazirki|indi)/.test(normalizedText)) return `⚡ Hazırkı güc: ${metrics.powerKw} kW`;
    if (/qənaət|qenaet|azaltm/.test(normalizedText)) {
      const previousAverage = Number(metrics.averageDailyKwh) * 1.08;
      const savingKwh = Math.max(0, previousAverage - Number(metrics.averageDailyKwh)) * metrics.daysInMonth;
      return `💰 Təxmini aylıq qənaət: ${(savingKwh * tariff).toFixed(2)} AZN`;
    }
    if (/büdcə|budce|limit/.test(normalizedText)) return `💳 Aylıq büdcə limiti: ${(options.energySettings?.monthlyBudgetAzn ?? 500).toFixed(2)} AZN`;
    if (/iş saat|is saat/.test(normalizedText)) return `🕒 İş saatları: ${options.energySettings?.workingHoursStart ?? "08:00"}–${options.energySettings?.workingHoursEnd ?? "22:00"}`;
    if (/pik|ən yüksək|en yuksek|maksimum/.test(normalizedText)) return `🔺 Pik güc: ${metrics.peakPowerKw} kW · ${metrics.peakTime}`;
    if (/bal|score|performans/.test(normalizedText)) return "🎯 Enerji performans balı: 82/100";
    if (/əlaqə|elaqe|contact|telefon|email|e-poçt|epoct/.test(normalizedText)) command = "/contact";
    else return "⚠️ Bu mövzu üzrə məlumat yoxdur.\n\nEnerji məlumatları üçün /help və ya Telegram menyusundakı komandaları istifadə edin. Əlaqə üçün /contact yazın.";
  }
  const help = `🧭 HEAT — Komanda menyusu\n\n/status — canlı vəziyyət\n/report — ətraflı hesabat\n/last24h — son 24 saat\n/day YYYY-MM-DD — seçilmiş gün\n/weekly və /monthly — dövr cədvəlləri\n/savings — qənaət\n/budget — büdcə vəziyyəti\n/setbudget 750 — aylıq büdcəni dəyiş\n/compare — müqayisələr\n/afterhours — iş saatından sonrakı itki\n/sethours 09:00 23:00 — iş saatlarını dəyiş\n/peaks — pik saatlar\n/score — enerji balı\n/recommendations — tədbirlər\n/devices — cihazlar\n/contact — HEAT ilə əlaqə\n\nAdi suallara yalnız soruşulan göstərici ilə qısa cavab verilir.`;
  if (command === "/start") {
    return `👋 HEAT enerji botuna xoş gəlmisiniz\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\n\n✅ Sistem işləyir\n⚡ Hazırkı güc: ${metrics.powerKw} kW\n🕒 Son yenilənmə: ${metrics.time}\n\nƏtraflı baxmaq üçün /status yazın. Bütün seçimlər üçün /help yazın.`;
  }
  if (command === "/help") return help;
  if (command === "/contact") return "📞 HEAT ilə əlaqə\n\nTelefon: +994 10 331 49 45\nE-poçt: heat.co2026@gmail.com\nSayt: https://heatenergyanalytics.com/#contact";
  if (command === "/status") {
    return `✅ HEAT — Canlı vəziyyət\n\n🏢 ${values.siteName}\n🕒 Ölçü vaxtı: ${metrics.time}\n\n⚡ Ümumi güc: ${metrics.powerKw} kW\n• ${phaseTitle("A", phases[0])}: ${metrics.phasePowersKw[0]} kW · ${metrics.phaseVoltagesV[0]} V · ${metrics.phaseCurrentsA[0]} A\n• ${phaseTitle("B", phases[1])}: ${metrics.phasePowersKw[1]} kW · ${metrics.phaseVoltagesV[1]} V · ${metrics.phaseCurrentsA[1]} A\n• ${phaseTitle("C", phases[2])}: ${metrics.phasePowersKw[2]} kW · ${metrics.phaseVoltagesV[2]} V · ${metrics.phaseCurrentsA[2]} A\n\n🔋 Bu gün: ${metrics.todayEnergyKwh} kWh\n📡 Məlumat axını: Aktiv\n🟢 İlkin qiymətləndirmə: Normal diapazona yaxındır\n\nHazırkı ölçümlərdə nəzərəçarpan kritik dəyişiklik görünmür.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/devices") {
    return `🔌 HEAT — Cihaz və bağlantı\n\n🏢 Obyekt: ${values.siteName}\n📟 Cihaz: ${values.deviceName}\n🆔 Device ID: ${values.deviceId}\n🧩 Model: ${values.deviceModel}\n\n☁️ Shelly Cloud: Qoşulub\n📡 Siqnal: ${metrics.signalDbm} dBm · Yaxşı\n⏱ Fasiləsiz iş: ${metrics.uptimeDays} gün\n📥 InfluxDB məlumat axını: Aktiv\n📊 Dashboard: Hazırdır\n🔔 Telegram xəbərdarlıqları: Aktiv\n\nSon məlumat: bu gün ${metrics.time}`;
  }
  if (command === "/savings") {
    const previousAverage = Number(metrics.averageDailyKwh) * 1.08;
    const savingKwh = Math.max(0, previousAverage - Number(metrics.averageDailyKwh)) * metrics.daysInMonth;
    return `💰 HEAT — Qənaət göstəricisi\n\nCari gündəlik orta: ${metrics.averageDailyKwh} kWh\nƏvvəlki baza: ${previousAverage.toFixed(1)} kWh\n⚡ Təxmini aylıq qənaət: ${savingKwh.toFixed(1)} kWh\n💳 Maliyyə təsiri: ${(savingKwh * tariff).toFixed(2)} AZN\n📉 Dəyişiklik: 7.4% azalma\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/budget") {
    const budget = options.energySettings?.monthlyBudgetAzn ?? 500;
    const used = Number(metrics.actualEnergyKwh) * tariff;
    const percent = used / budget * 100;
    return `💳 HEAT — Aylıq büdcə\n\nLimit: ${budget.toFixed(2)} AZN\nİstifadə olunub: ${used.toFixed(2)} AZN (${percent.toFixed(1)}%)\nQalıq: ${Math.max(0, budget - used).toFixed(2)} AZN\nAy sonu proqnozu: ${metrics.projectedCostAzn} AZN\n\n${percent >= 80 ? "⚠️ Büdcə xəbərdarlığı həddinə yaxınlaşırsınız." : "✅ Büdcə hazırda nəzarətdədir."}`;
  }
  if (command === "/compare") {
    const current = Number(metrics.latestEnergyKwh);
    const previous = Number(metrics.previous24hKwh);
    return `📊 HEAT — Dövr müqayisəsi\n\nSon 24 saat: ${current.toFixed(1)} kWh · ${(current * tariff).toFixed(2)} AZN\nƏvvəlki 24 saat: ${previous.toFixed(1)} kWh · ${(previous * tariff).toFixed(2)} AZN\nFərq: ${(current - previous).toFixed(1)} kWh · ${((current - previous) * tariff).toFixed(2)} AZN\nDəyişiklik: ${metrics.changePercent}%\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/afterhours") {
    const energy = Number(metrics.latestEnergyKwh) * 0.09;
    const hours = options.energySettings ? `${options.energySettings.workingHoursStart ?? "08:00"}–${options.energySettings.workingHoursEnd ?? "22:00"}` : values.workingHours || "08:00–22:00";
    return `🌙 HEAT — İş saatından sonrakı sərfiyyat\n\nİş saatları: ${hours}\n⚡ Sərfiyyat: ${energy.toFixed(2)} kWh\n💸 Xərc: ${(energy * tariff).toFixed(2)} AZN\n📊 Günlük sərfiyyatın 9.0%-i\n🔮 Aylıq itki proqnozu: ${(energy * tariff * metrics.daysInMonth).toFixed(2)} AZN\n\nSoyuducu kimi daim işləməli cihazları nəzərə alaraq digər xətləri yoxlayın.`;
  }
  if (command === "/peaks") {
    return `🔺 HEAT — Pik saatlar\n\n1. ${metrics.peakTime} · ${metrics.peakPowerKw} kW\n2. 18:00 · ${(Number(metrics.peakPowerKw) * 0.91).toFixed(2)} kW\n3. 13:00 · ${(Number(metrics.peakPowerKw) * 0.84).toFixed(2)} kW\n\nMümkün səbəb: bir neçə yüksək güclü avadanlığın eyni vaxtda işləməsi.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/score") return `🎯 HEAT — Enerji performans balı\n\n82/100 · Yaxşı\n\n• Qənaət trendi: yaxşı\n• Pik yük: diqqət tələb edir\n• İş saatından sonrakı sərfiyyat: orta\n• Faza balansı: normal\n\nBal avtomatik ölçmələr əsasında hesablanır.`;
  if (command === "/recommendations") return `💡 HEAT — Tövsiyələr\n\n1. Pik saatlarda yüksək güclü avadanlıqları 10–15 dəqiqə fərqlə işə salın.\n2. Bağlanışdan sonra samovar və işıq xətlərini yoxlayın.\n3. Daim işləməli soyuducuların gecə baza sərfiyyatını ayrıca izləyin.\n\n💰 Təxmini qənaət potensialı: 18.40 AZN / ay\n\n${ANALYTICS_NOTICE}`;
  if (command === "/day") {
    const selected = options.parameter ?? "";
    const selectedDate = new Date(`${selected}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selected) || Number.isNaN(selectedDate.getTime()) || selectedDate.toISOString().slice(0, 10) !== selected) {
      return "Tarixi belə yazın: /day YYYY-MM-DD\nNümunə: /day 2026-08-12";
    }
    if (selected > bakuDateKey()) return "Gələcək tarix üçün enerji məlumatı yoxdur.";
    const energy = demoEnergyForDate(selected);
    return `📅 HEAT — Seçilmiş gün\n\nObyekt: ${values.siteName}\nTarix: ${selected}\n⚡ Enerji sərfiyyatı: ${energy.toFixed(2)} kWh\n💳 Məbləğ: ${(energy * tariff).toFixed(2)} AZN\nTarif: ${tariff.toFixed(4)} AZN/kWh\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/weekly" || command === "/monthly") {
    const today = new Date(`${bakuDateKey()}T00:00:00Z`);
    const start = command === "/weekly"
      ? new Date(today.getTime() - 7 * 86400000)
      : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const count = command === "/weekly" ? 7 : Math.max(1, today.getUTCDate() - 1);
    const rows = demoPeriodRows(start, count);
    const total = rows.reduce((sum, row) => sum + row.energyKwh, 0);
    const title = command === "/weekly" ? "Həftəlik hesabat" : "Aylıq hesabat";
    return `📊 HEAT — ${title}\n\n${rows.map((row) => `${row.dateKey} · ${row.energyKwh.toFixed(2)} kWh · ${row.costAzn.toFixed(2)} AZN`).join("\n")}\n\nCƏM: ${total.toFixed(2)} kWh · ${(total * tariff).toFixed(2)} AZN\nTarif: ${tariff.toFixed(4)} AZN/kWh\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/report") {
    return `${automaticHeader}📊 HEAT — Ətraflı enerji hesabatı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nTarix: ${metrics.dateKey}\nTarif: ${tariff.toFixed(4)} AZN/kWh\n\nÜMUMİ GÖSTƏRİCİLƏR\n⚡ Hazırkı ümumi güc: ${metrics.powerKw} kW\n🔋 Bu gün indiyədək: ${metrics.todayEnergyKwh} kWh\n📅 Son tamamlanmış 24 saat: ${metrics.latestEnergyKwh} kWh · ${total24hCost} AZN\n\nFAZALAR — CANLI GÜC\n${phaseTitle("A", phases[0])}: ${metrics.phasePowersKw[0]} kW · ${metrics.phaseVoltagesV[0]} V · ${metrics.phaseCurrentsA[0]} A\n${phaseTitle("B", phases[1])}: ${metrics.phasePowersKw[1]} kW · ${metrics.phaseVoltagesV[1]} V · ${metrics.phaseCurrentsA[1]} A\n${phaseTitle("C", phases[2])}: ${metrics.phasePowersKw[2]} kW · ${metrics.phaseVoltagesV[2]} V · ${metrics.phaseCurrentsA[2]} A\n\nFAZALAR — SON 24 SAAT ENERJİ VƏ XƏRC\n${phaseTitle("A", phases[0])}: ${metrics.phaseEnergyKwh[0]} kWh · ${phaseCosts[0]} AZN · ümuminin ${metrics.phaseSharesPct[0]}%-i\n${phaseTitle("B", phases[1])}: ${metrics.phaseEnergyKwh[1]} kWh · ${phaseCosts[1]} AZN · ümuminin ${metrics.phaseSharesPct[1]}%-i\n${phaseTitle("C", phases[2])}: ${metrics.phaseEnergyKwh[2]} kWh · ${phaseCosts[2]} AZN · ümuminin ${metrics.phaseSharesPct[2]}%-i\nCəm: ${metrics.latestEnergyKwh} kWh · ${total24hCost} AZN\n\nBU AY\n📈 İndiyədək sərfiyyat: ${metrics.actualEnergyKwh} kWh\n📊 Günlük orta: ${metrics.averageDailyKwh} kWh\n💳 Təxmini cari xərc: ${monthActualCost} AZN\n🔮 Təxmini ay sonu proqnozu: ${metrics.projectedKwh} kWh · ${projectedCost} AZN\n\n💡 Mümkün optimallaşdırma\nƏn çox yük hazırda ${phaseTitle("A", phases[0])} xəttində görünür. Pik saatlarda yüksək güclü cihazları fərqli vaxtlarda işlətmək sərfiyyatı və fazalar arasındakı fərqi azaltmağa kömək edə bilər. Nəticə iş rejimindən asılıdır.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/last24h") {
    const direction = Number(metrics.changePercent) >= 0 ? "artıb" : "azalıb";
    return `🕘 HEAT — Son 24 saat\n\n🏢 ${values.siteName}\n📅 ${metrics.dateKey}\nTarif: ${tariff.toFixed(4)} AZN/kWh\n\nSAAT ARALIQLARI\n00:00–06:00  ${metrics.blockEnergyKwh[0]} kWh\n06:00–12:00  ${metrics.blockEnergyKwh[1]} kWh\n12:00–18:00  ${metrics.blockEnergyKwh[2]} kWh\n18:00–24:00  ${metrics.blockEnergyKwh[3]} kWh\n\nFAZALAR\n${phaseTitle("A", phases[0])}: ${metrics.phaseEnergyKwh[0]} kWh · ${phaseCosts[0]} AZN · hazırda ${metrics.phasePowersKw[0]} kW\n${phaseTitle("B", phases[1])}: ${metrics.phaseEnergyKwh[1]} kWh · ${phaseCosts[1]} AZN · hazırda ${metrics.phasePowersKw[1]} kW\n${phaseTitle("C", phases[2])}: ${metrics.phaseEnergyKwh[2]} kWh · ${phaseCosts[2]} AZN · hazırda ${metrics.phasePowersKw[2]} kW\n\n🔋 Ümumi enerji: ${metrics.latestEnergyKwh} kWh · ${total24hCost} AZN\n⚡ Hazırkı ümumi güc: ${metrics.powerKw} kW\n⚡ 24 saatlıq orta güc: ${metrics.averagePowerKw} kW\n🔺 Ölçülən ən yüksək güc: ${metrics.peakPowerKw} kW · saat ${metrics.peakTime}\n\nMÜQAYİSƏ\nƏvvəlki 24 saat: ${metrics.previous24hKwh} kWh\nHesablamaya görə istehlak təxminən ${Math.abs(Number(metrics.changePercent)).toFixed(1)}% ${direction}.\n\n${Number(metrics.changePercent) > 5 ? "⚠️ Artım ehtimalı görünür. Pik saatdakı cihazları yerində yoxlamaq faydalı ola bilər." : "✅ Ölçümlərdə kəskin dəyişiklik görünmür."}\n\n${ANALYTICS_NOTICE}`;
  }
  return `Bu komanda tanınmadı.\n\n${help}`;
}

export function demoTelegramAlert(kind: "peak" | "anomaly", values: ProvisioningInput): string {
  const metrics = demoOperationalMetrics();
  const phases = phaseNames(values);
  if (kind === "peak") {
    const peak = Number(metrics.peakPowerKw);
    const phaseA = (peak * 0.45).toFixed(2);
    const phaseB = (peak * 0.32).toFixed(2);
    const phaseC = (peak * 0.23).toFixed(2);
    return `⚠️ HEAT — Yüksək güc ehtimalı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nÖlçü vaxtı: ${metrics.peakTime}\n\n🔺 Ölçülən ümumi güc: ${peak.toFixed(2)} kW\n• ${phaseTitle("A", phases[0])}: ${phaseA} kW\n• ${phaseTitle("B", phases[1])}: ${phaseB} kW\n• ${phaseTitle("C", phases[2])}: ${phaseC} kW\n📏 Təyin edilmiş müqayisə həddi: 9.50 kW\n📈 Həddən fərq: ${(peak - 9.5).toFixed(2)} kW\n\nMümkün izah:\nBir neçə yüksək güclü cihazın eyni vaxtda işləməsi bu göstəriciyə səbəb ola bilər. Başqa səbəblər də mümkündür.\n\n💡 Ehtiyatlı addım:\nTəhlükəsizdirsə, məsul şəxs cihazların iş rejimini yerində yoxlaya və yükün növbəti ölçümlərdə davam edib-etmədiyini izləyə bilər. Elektrik müdaxiləsini yalnız ixtisaslı şəxs etməlidir.\n\n🟠 İlkin status: Yoxlama tövsiyə olunur\n\n${ANALYTICS_NOTICE}`;
  }
  const anomalyPower = 6.1;
  const normalNightPower = 1.27;
  return `🚨 HEAT — Qeyri-adi göstərici ehtimalı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nÖlçü vaxtı: 01:42\n\n⚡ ${phaseTitle("A", phases[0])} ölçümü: ${anomalyPower.toFixed(2)} kW\n📉 Müqayisə üçün gecə bazası: ${normalNightPower.toFixed(2)} kW\n📈 Fərq: təxminən ${(anomalyPower / normalNightPower).toFixed(1)} dəfə\n⏱ Müşahidə müddəti: 18 dəqiqə\n💸 Hesablanan əlavə sərfiyyat: təxminən 1.83 kWh\n\nMümkün izahlar:\nCihazın açıq qalması, iş rejiminin dəyişməsi, ölçmə rabitəsində keçici problem və ya başqa texniki səbəb ola bilər.\n\n🔎 Tövsiyə olunan yoxlama:\n1. Təhlükəsizdirsə, məsul şəxs cihazların vəziyyətini yerində yoxlaya bilər.\n2. Göstərici davam edərsə, ixtisaslı elektrik mütəxəssisinin yoxlaması məqsədəuyğundur.\n3. Tək bir avtomatik bildiriş əsasında elektrik xəttinə müdaxilə edilməməlidir.\n\n🔴 İlkin status: Əlavə yoxlama tövsiyə olunur\n\n${ANALYTICS_NOTICE}`;
}

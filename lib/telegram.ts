import type { ProvisioningInput } from "@/lib/provisioning";
import { bakuDateKey, demoEnergyForDate, demoOperationalMetrics, demoPeriodRows } from "@/lib/demo-customer";
import type { EnergySettings } from "@/lib/customer-insights";

const ANALYTICS_NOTICE = "ℹ️ Qeyd: Bu, avtomatik ölçmə və analitikaya əsaslanan ilkin məlumatdır. Qəti diaqnoz deyil; qərardan əvvəl göstəriciləri yerində və lazım olduqda ixtisaslı mütəxəssislə yoxlayın.";

export const TELEGRAM_COMMANDS = [
  { command: "start", description: "HEAT botunu aç" },
  { command: "status", description: "Canlı report + sadə AI izahı" },
  { command: "report", description: "Gündəlik report + AI analizi" },
  { command: "last24h", description: "Son 24 saat + AI analizi" },
  { command: "day", description: "Seçilmiş gün: /day YYYY-MM-DD" },
  { command: "weekly", description: "Həftəlik report + AI analizi" },
  { command: "monthly", description: "Aylıq report + AI analizi" },
  { command: "detailreport", description: "Daha ətraflı enerji reportu" },
  { command: "detailanalysis", description: "Daha ətraflı AI analizi" },
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

const TELEGRAM_DETAIL_COMMANDS = "📊 Daha ətraflı report: /detailreport\n🤖 Daha ətraflı AI analizi: /detailanalysis";

export function composeDailyTelegramMessage(reportText: string, analysisText?: string | null): string {
  return `${reportText}${analysisText ? `\n\n${analysisText}` : ""}\n\n${TELEGRAM_DETAIL_COMMANDS}`.slice(0, 4000);
}

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

export function demoTelegramOwnerSummary(
  values: ProvisioningInput,
  energySettings: Partial<EnergySettings> = {},
): string {
  const metrics = demoOperationalMetrics();
  const tariff = values.electricityTariffAznPerKwh;
  const currentKwh = Number(metrics.latestEnergyKwh);
  const previousKwh = Number(metrics.previous24hKwh);
  const currentCost = currentKwh * tariff;
  const previousCost = previousKwh * tariff;
  const costDifference = currentCost - previousCost;
  const changePercent = Number(metrics.changePercent);
  const projectedCost = Number(metrics.projectedKwh.replace(/,/g, "")) * tariff;
  const budget = energySettings.monthlyBudgetAzn ?? 500;

  const arrow = changePercent > 0 ? "⬆️" : changePercent < 0 ? "⬇️" : "➡️";
  return `📊 REPORT — SON 24 SAAT

🏢 Obyekt: ${values.siteName}

💳 Xərc: ${currentCost.toFixed(2)} AZN
⚡ İstifadə: ${currentKwh.toFixed(1)} kWh
${arrow} Dünənlə fərq: ${costDifference >= 0 ? "+" : ""}${costDifference.toFixed(2)} AZN (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%)
🔮 Ay sonu xərc proqnozu: ${projectedCost.toFixed(2)} AZN
🎯 Aylıq büdcə: ${budget.toFixed(2)} AZN`;
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
  if (!command.trim().startsWith("/")) command = "/help";
  const help = `🧭 HEAT — Komandalar və izahı\n\n📡 CANLI VƏZİYYƏT\n/status — əvvəl sadə canlı report, sonra ayrıca AI izahı göndərir.\n/devices — hesabınıza qoşulmuş cihazları və bağlantı vəziyyətini göstərir.\n\n📊 HESABATLAR\n/report — əvvəl sadə gündəlik report, sonra ayrıca AI analizi göndərir.\n/last24h — son 24 saatın sadə reportunu və AI izahını göndərir.\n/day YYYY-MM-DD — seçdiyiniz günün sərfiyyat və xərcini göstərir. Nümunə: /day 2026-08-14\n/weekly — əvvəl son 7 günün reportunu, sonra həftəlik AI analizini göndərir.\n/monthly — əvvəl cari ayın reportunu, sonra aylıq AI analizini göndərir.\n\n💰 QƏNAƏT VƏ BÜDCƏ\n/savings — əvvəlki dövrlə müqayisədə təxmini enerji və pul qənaətini göstərir.\n/budget — aylıq büdcə limitini, istifadəni, qalığı və ay sonu proqnozunu göstərir.\n/setbudget 750 — aylıq büdcə limitini dəyişir. Nümunə: /setbudget 750\n/compare — cari və əvvəlki dövrün kWh, AZN və faiz fərqini göstərir.\n\n🕒 İŞ SAATLARI VƏ YÜK\n/afterhours — iş saatından sonrakı sərfiyyatı və təxmini itkini göstərir.\n/sethours 09:00 23:00 — obyektin iş saatlarını dəyişir. Nümunə: /sethours 09:00 23:00\n/peaks — ən yüksək enerji yükü olan saatları və pik gücü göstərir.\n\n🎯 ANALİTİKA\n/score — obyektin 100 üzərindən enerji performans balını göstərir.\n/recommendations — sərfiyyatı azaltmaq üçün konkret tədbirləri göstərir.\n\n☎️ DƏSTƏK\n/contact — HEAT telefon, e-poçt və sayt məlumatlarını göstərir.\n/help — bu izahlı komanda siyahısını yenidən açır.\n\nMəlumat almaq üçün uyğun komandanın üzərinə toxunun və ya onu yazın.`;
  if (command === "/start") {
    return `👋 HEAT enerji botuna xoş gəlmisiniz\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\n\n✅ Sistem işləyir\n⚡ Hazırkı güc: ${metrics.powerKw} kW\n🕒 Son yenilənmə: ${metrics.time}\n\nƏtraflı baxmaq üçün /status yazın. Bütün seçimlər üçün /help yazın.`;
  }
  if (command === "/help") return help;
  if (command === "/contact") return "📞 HEAT ilə əlaqə\n\nTelefon: +994 10 331 49 45\nE-poçt: heat.co2026@gmail.com\nSayt: https://heatenergyanalytics.com/#contact";
  if (command === "/status") {
    return `📋 REPORT — CANLI VƏZİYYƏT\n\n🏢 Obyekt: ${values.siteName}\n🕒 Son ölçü: ${metrics.time}\n\nƏSAS NƏTİCƏ\n🟢 Sistem işləyir və hazırkı ölçüdə kritik dəyişiklik görünmür.\n\n⚡ Hazırda istifadə olunan güc: ${metrics.powerKw} kW\n🔋 Bu gün istifadə olunan enerji: ${metrics.todayEnergyKwh} kWh\n📡 Məlumat axını: Aktiv\n\nXƏTLƏR ÜZRƏ HAZIRKI YÜK\n• ${phaseTitle("A", phases[0])}: ${metrics.phasePowersKw[0]} kW\n• ${phaseTitle("B", phases[1])}: ${metrics.phasePowersKw[1]} kW\n• ${phaseTitle("C", phases[2])}: ${metrics.phasePowersKw[2]} kW\n\nSADƏ İZAH\nkW — cihazların məhz indi istifadə etdiyi gücdür.\nkWh — gün ərzində istifadə olunmuş ümumi enerjidir.\n\nNÖVBƏTİ ADDIM\nHazırda təcili tədbir lazım deyil. AI izahı növbəti mesajda gələcək.\n\n${ANALYTICS_NOTICE}`;
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
    const highest = rows.reduce((result, row) => row.energyKwh > result.energyKwh ? row : result, rows[0]);
    const lowest = rows.reduce((result, row) => row.energyKwh < result.energyKwh ? row : result, rows[0]);
    const averageCost = rows.reduce((sum, row) => sum + row.costAzn, 0) / rows.length;
    const title = command === "/weekly" ? "Həftəlik hesabat" : "Aylıq hesabat";
    return `📋 REPORT — ${title.toLocaleUpperCase("az")}\n\n🏢 Obyekt: ${values.siteName}\n📅 Dövr: ${command === "/weekly" ? "Son 7 tamamlanmış gün" : "Bu ayın tamamlanmış günləri"}\n\nƏSAS NƏTİCƏ\n⚡ Ümumi enerji: ${total.toFixed(2)} kWh\n💳 Ümumi xərc: ${(total * tariff).toFixed(2)} AZN\n📊 Bir günə orta xərc: ${averageCost.toFixed(2)} AZN\n🔺 Ən çox sərfiyyat: ${highest.dateKey} — ${highest.costAzn.toFixed(2)} AZN\n🔻 Ən az sərfiyyat: ${lowest.dateKey} — ${lowest.costAzn.toFixed(2)} AZN\n\nGÜNLƏR ÜZRƏ\n${rows.map((row) => `${row.dateKey}: ${row.costAzn.toFixed(2)} AZN · ${row.energyKwh.toFixed(1)} kWh`).join("\n")}\n\nSADƏ İZAH\nYuxarıdakı məbləğlər hər gün elektrikə təxminən nə qədər pul xərcləndiyini göstərir. AI növbəti mesajda artımın mümkün səbəbini və görüləcək addımları izah edəcək.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/report") {
    return `${automaticHeader}📋 REPORT — ƏTRAFLI ENERJİ HESABATI\n\n🏢 Obyekt: ${values.siteName}\n📅 Tarix: ${metrics.dateKey}\n\nƏSAS NƏTİCƏLƏR\n💳 Son 24 saatın xərci: ${total24hCost} AZN\n⚡ Son 24 saatın enerjisi: ${metrics.latestEnergyKwh} kWh\n🔋 Bu gün indiyədək: ${metrics.todayEnergyKwh} kWh\n⚙️ Hazırda işləyən ümumi güc: ${metrics.powerKw} kW\n\nXƏTLƏR ÜZRƏ XƏRC — SON 24 SAAT\n• ${phaseTitle("A", phases[0])}: ${phaseCosts[0]} AZN · ümumi sərfiyyatın ${metrics.phaseSharesPct[0]}%-i\n• ${phaseTitle("B", phases[1])}: ${phaseCosts[1]} AZN · ümumi sərfiyyatın ${metrics.phaseSharesPct[1]}%-i\n• ${phaseTitle("C", phases[2])}: ${phaseCosts[2]} AZN · ümumi sərfiyyatın ${metrics.phaseSharesPct[2]}%-i\n\nBU AY\n💳 İndiyədək təxmini xərc: ${monthActualCost} AZN\n📊 Bir günə orta enerji: ${metrics.averageDailyKwh} kWh\n🔮 Ay sonu xərc proqnozu: ${projectedCost} AZN\n\nSADƏ İZAH\nƏn böyük xərc payı ${phaseTitle("A", phases[0])} xəttindədir. Bu, həmin xəttə qoşulan cihazların daha çox işlədiyini göstərir; nasazlıq demək deyil. AI növbəti mesajda mümkün səbəbləri və ən faydalı addımları izah edəcək.\n\n${ANALYTICS_NOTICE}`;
  }
  if (command === "/last24h") {
    const direction = Number(metrics.changePercent) >= 0 ? "artıb" : "azalıb";
    return `📋 REPORT — SON 24 SAAT\n\n🏢 ${values.siteName}\n📅 ${metrics.dateKey}\n\nƏSAS NƏTİCƏ\n💳 Xərc: ${total24hCost} AZN\n🔋 Enerji: ${metrics.latestEnergyKwh} kWh\n🔺 Ən yüksək yük: ${metrics.peakPowerKw} kW · saat ${metrics.peakTime}\n\nGÜNÜN HİSSƏLƏRİ\n00:00–06:00: ${metrics.blockEnergyKwh[0]} kWh\n06:00–12:00: ${metrics.blockEnergyKwh[1]} kWh\n12:00–18:00: ${metrics.blockEnergyKwh[2]} kWh\n18:00–24:00: ${metrics.blockEnergyKwh[3]} kWh\n\nMÜQAYİSƏ\nƏvvəlki günlə müqayisədə sərfiyyat ${Math.abs(Number(metrics.changePercent)).toFixed(1)}% ${direction}.\n${Number(metrics.changePercent) > 5 ? "⚠️ Artım var; AI növbəti mesajda mümkün səbəbləri izah edəcək." : "✅ Kəskin dəyişiklik görünmür; AI növbəti mesajda əlavə izah verəcək."}\n\n${ANALYTICS_NOTICE}`;
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

import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { customerDailyEnergy, customerEnergySnapshots } from "@/db/schema";
import { getCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { buildCustomerInsights } from "@/lib/customer-insights";
import { demoInsightRows, demoInsightSnapshots } from "@/lib/demo-customer-insights";
import { bakuDateKey, DEMO_CUSTOMER, DEMO_EDIT_VALUES, demoOperationalMetrics } from "@/lib/demo-customer";
import type { ProvisioningInput } from "@/lib/provisioning";

export type EnergyAnalysisPeriod = "status" | "daily" | "weekly" | "monthly";

function periodInstruction(period: EnergyAnalysisPeriod): string {
  if (period === "status") {
    return "Yalnız hazırkı güc, fazaların yükü və sistemin cari vəziyyətinə fokuslan. Texniki vahidləri sadə sözlərlə izah et və indi yoxlanmalı bir şey olub-olmadığını de.";
  }
  if (period === "weekly") {
    return "Son 7 günün dəyişiminə fokuslan. Ən çox və ən az sərfiyyat olan günləri, ümumi istiqaməti və növbəti həftə üçün ən faydalı addımı sadə dildə göstər.";
  }
  if (period === "monthly") {
    return "Cari ayın indiyədək nəticəsinə, büdcəyə və ay sonu proqnozuna fokuslan. Sahibkarın ay bitənədək nə etməli olduğunu sadə dildə göstər.";
  }
  return "Son 24 saata fokuslan. Dünənlə fərqi, əsas xərc səbəbini və bu gün görüləcək ən faydalı addımı sadə dildə göstər.";
}

export async function buildDemoEnergyAnalysisPackage(
  now = new Date(),
  period: EnergyAnalysisPeriod = "daily",
): Promise<string> {
  const dateKey = bakuDateKey(now);
  const metrics = demoOperationalMetrics(now);
  const settings = await getCustomerEnergySettings(DEMO_CUSTOMER.id);
  const rows = demoInsightRows(dateKey);
  const insights = buildCustomerInsights(
    rows,
    demoInsightSnapshots(dateKey),
    settings,
    dateKey,
  );
  const tariff = DEMO_EDIT_VALUES.electricityTariffAznPerKwh;
  const currentKwh = Number(metrics.latestEnergyKwh);
  const previousKwh = Number(metrics.previous24hKwh);
  const currentCost = currentKwh * tariff;
  const previousCost = previousKwh * tariff;
  const recentDays = rows.slice(-7).map((row) =>
    `${row.localDate}: ${row.energyKwh.toFixed(2)} kWh | ${row.costAzn.toFixed(2)} AZN`
  ).join("\n");
  const phaseLines = (["A", "B", "C"] as const).map((letter, index) =>
    `Faza ${letter} — ${[DEMO_EDIT_VALUES.phaseALabel, DEMO_EDIT_VALUES.phaseBLabel, DEMO_EDIT_VALUES.phaseCLabel][index]}: ` +
    `${metrics.phaseEnergyKwh[index]} kWh | ${metrics.phaseSharesPct[index]}% | ` +
    `hazırkı ${metrics.phasePowersKw[index]} kW | ${metrics.phaseVoltagesV[index]} V | ${metrics.phaseCurrentsA[index]} A`
  ).join("\n");
  const peakLines = insights.peaks.hours.length > 0
    ? insights.peaks.hours.map((item, index) =>
        `${index + 1}. ${item.hour}: ${item.energyKwh.toFixed(2)} kWh | pik ${item.peakKw.toFixed(2)} kW`
      ).join("\n")
    : "Kifayət qədər məlumat yoxdur.";

  return `GEMINI NOTEBOOK ÜÇÜN GÜNLÜK ENERJİ MƏLUMAT PAKETİ

MƏLUMATIN STATUSU
Mənbə: HEAT virtual Demo məlumatları
Tarix: ${dateKey}
Analiz dövrü: ${period}
Saat qurşağı: ${DEMO_EDIT_VALUES.timezone}
Qeyd: Demo ölçüləri realist simulyasiyadır, real elektrik ölçməsi deyil.

OBYEKT KONTEKSTİ
Müştəri: ${DEMO_CUSTOMER.customerName}
Obyekt: ${DEMO_CUSTOMER.siteName}
Biznes sahəsi: ${DEMO_EDIT_VALUES.businessType}
İş saatları: ${settings.workingHoursStart}–${settings.workingHoursEnd}
Əsas avadanlıqlar: ${DEMO_EDIT_VALUES.majorEquipment}
Daim işləməli avadanlıqlar: ${DEMO_EDIT_VALUES.alwaysOnEquipment}
Enerji məqsədi: ${DEMO_EDIT_VALUES.energyGoals}
Əlavə məkan məlumatı: ${DEMO_EDIT_VALUES.siteContext}
Elektrik tarifi: ${tariff.toFixed(4)} AZN/kWh

SON 24 SAAT
Enerji: ${currentKwh.toFixed(2)} kWh
Xərc: ${currentCost.toFixed(2)} AZN
Əvvəlki 24 saat: ${previousKwh.toFixed(2)} kWh | ${previousCost.toFixed(2)} AZN
Fərq: ${(currentKwh - previousKwh).toFixed(2)} kWh | ${(currentCost - previousCost).toFixed(2)} AZN | ${metrics.changePercent}%
Orta güc: ${metrics.averagePowerKw} kW
Ən yüksək güc: ${metrics.peakPowerKw} kW | saat ${metrics.peakTime}
Hazırkı güc: ${metrics.powerKw} kW

6 SAATLIQ İNTERVALLAR
00:00–06:00: ${metrics.blockEnergyKwh[0]} kWh
06:00–12:00: ${metrics.blockEnergyKwh[1]} kWh
12:00–18:00: ${metrics.blockEnergyKwh[2]} kWh
18:00–24:00: ${metrics.blockEnergyKwh[3]} kWh

FAZALAR
${phaseLines}

İŞ SAATINDAN KƏNAR İSTİFADƏ
Enerji: ${insights.afterHours.energyKwh.toFixed(2)} kWh
Xərc: ${insights.afterHours.amountAzn.toFixed(2)} AZN
Pay: ${insights.afterHours.sharePercent.toFixed(1)}%
Aylıq xərc proqnozu: ${insights.afterHours.projectedMonthlyAzn.toFixed(2)} AZN

PİK SAATLAR
Hədd: ${settings.peakThresholdKw.toFixed(2)} kW
${peakLines}

AYLIQ VƏ BÜDCƏ GÖSTƏRİCİLƏRİ
Bu ay indiyədək: ${metrics.actualEnergyKwh} kWh | ${insights.budget.usedAzn.toFixed(2)} AZN
Ay sonu enerji proqnozu: ${metrics.projectedKwh} kWh
Ay sonu xərc proqnozu: ${metrics.projectedCostAzn} AZN
Aylıq büdcə: ${insights.budget.limitAzn.toFixed(2)} AZN
Büdcə istifadəsi: ${insights.budget.percent.toFixed(1)}%
Enerji performans balı: ${insights.score.value}/100 — ${insights.score.label}

SON 7 GÜN
${recentDays}

GEMINI ÜÇÜN TAPŞIRIQ
${periodInstruction(period)}
Bu məlumatları Azərbaycan dilində, enerji sahəsindən heç başı çıxmayan biznes sahibinin anlayacağı formada analiz et. Qısa cümlələr və gündəlik sözlər istifadə et. kW və kWh kimi vahidlərin biznes üçün mənasını sadə izah et. Çıxışda: 1) qısa xülasə, 2) ən vacib müşahidə, 3) prioritet üzrə ən çox 3 konkret addım, 4) mümkün qənaət və 5) məlumat məhdudiyyəti olsun. Ölçülən və təxmini göstəriciləri ayır, məlumatda olmayan faktları uydurma və elektrik nasazlığı barədə qəti diaqnoz vermə.`;
}

function dateOffset(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function buildCustomerEnergyAnalysisPackage(
  customerId: string,
  values: ProvisioningInput,
  now = new Date(),
  period: EnergyAnalysisPeriod = "daily",
): Promise<string> {
  if (customerId === DEMO_CUSTOMER.id) return buildDemoEnergyAnalysisPackage(now, period);
  const dateKey = bakuDateKey(now);
  const historyStart = dateOffset(dateKey, -70);
  const snapshotStart = new Date(`${dateKey.slice(0, 7)}-01T00:00:00+04:00`).toISOString();
  const db = getDb({ readFromPrimary: true });
  const [settings, rows, snapshots] = await Promise.all([
    getCustomerEnergySettings(customerId),
    db.select({ localDate: customerDailyEnergy.localDate, energyKwh: customerDailyEnergy.energyKwh, costAzn: customerDailyEnergy.costAzn })
      .from(customerDailyEnergy).where(and(eq(customerDailyEnergy.customerId, customerId), gte(customerDailyEnergy.localDate, historyStart))).orderBy(asc(customerDailyEnergy.localDate)),
    db.select({ measuredAt: customerEnergySnapshots.measuredAt, totalPowerKw: customerEnergySnapshots.totalPowerKw, phaseAKw: customerEnergySnapshots.phaseAKw, phaseBKw: customerEnergySnapshots.phaseBKw, phaseCKw: customerEnergySnapshots.phaseCKw, totalEnergyKwh: customerEnergySnapshots.totalEnergyKwh })
      .from(customerEnergySnapshots).where(and(eq(customerEnergySnapshots.customerId, customerId), gte(customerEnergySnapshots.measuredAt, snapshotStart))).orderBy(asc(customerEnergySnapshots.measuredAt)),
  ]);
  if (rows.length === 0 && snapshots.length === 0) {
    throw new Error("Bu müştəri üçün analiz ediləcək enerji məlumatı hələ daxil olmayıb.");
  }
  const insights = buildCustomerInsights(rows, snapshots, settings, dateKey);
  const latest = snapshots.at(-1);
  const recentDays = rows.slice(-31);
  const today = rows.find((row) => row.localDate === dateKey);
  const yesterday = rows.find((row) => row.localDate === dateOffset(dateKey, -1));
  const phaseLabels = [values.phaseALabel, values.phaseBLabel, values.phaseCLabel];
  const phaseValues = [latest?.phaseAKw, latest?.phaseBKw, latest?.phaseCKw];
  const phaseLines = phaseLabels.map((label, index) => `${label}: ${phaseValues[index] == null ? "məlumat yoxdur" : `${Number(phaseValues[index]).toFixed(2)} kW`}`).join("\n");
  const dayLines = recentDays.length > 0
    ? recentDays.map((row) => `${row.localDate}: ${row.energyKwh.toFixed(2)} kWh | ${row.costAzn.toFixed(2)} AZN`).join("\n")
    : "Gündəlik yekun məlumat hələ yoxdur.";

  return `HEAT MÜŞTƏRİ ENERJİ ANALİZİ MƏLUMAT PAKETİ

MƏLUMATIN STATUSU
Mənbə: müştərinin HEAT sisteminə ötürülmüş ölçmələri
Tarix: ${dateKey}
Analiz dövrü: ${period}
Saat qurşağı: ${values.timezone}

OBYEKT KONTEKSTİ
Müştəri: ${values.customerName}
Obyekt: ${values.siteName}
Biznes sahəsi: ${values.businessType || "qeyd edilməyib"}
İş saatları: ${settings.workingHoursStart}–${settings.workingHoursEnd}
Əsas avadanlıqlar: ${values.majorEquipment || "qeyd edilməyib"}
Daim işləməli avadanlıqlar: ${values.alwaysOnEquipment || "qeyd edilməyib"}
Enerji məqsədi: ${values.energyGoals || "qeyd edilməyib"}
Əlavə məkan məlumatı: ${values.siteContext || "qeyd edilməyib"}
Elektrik tarifi: ${values.electricityTariffAznPerKwh.toFixed(4)} AZN/kWh

CARİ VƏZİYYƏT
Son ölçü: ${latest?.measuredAt || "məlumat yoxdur"}
Hazırkı ümumi güc: ${latest ? `${latest.totalPowerKw.toFixed(2)} kW` : "məlumat yoxdur"}
${phaseLines}

GÜNLÜK MÜQAYİSƏ
Bu gün: ${today ? `${today.energyKwh.toFixed(2)} kWh | ${today.costAzn.toFixed(2)} AZN` : "tamamlanmış məlumat yoxdur"}
Dünən: ${yesterday ? `${yesterday.energyKwh.toFixed(2)} kWh | ${yesterday.costAzn.toFixed(2)} AZN` : "məlumat yoxdur"}

BİZNES GÖSTƏRİCİLƏRİ
Ay üzrə istifadə: ${insights.budget.usedAzn.toFixed(2)} AZN
Ay sonu xərc proqnozu: ${insights.budget.projectedAzn.toFixed(2)} AZN
Aylıq büdcə: ${insights.budget.limitAzn.toFixed(2)} AZN
Büdcə istifadəsi: ${insights.budget.percent.toFixed(1)}%
İş saatından kənar xərc: ${insights.afterHours.amountAzn.toFixed(2)} AZN
Ölçülən pik güc: ${insights.peaks.measuredPeakKw.toFixed(2)} kW
Enerji performans balı: ${insights.score.value}/100 — ${insights.score.label}
Təxmini qənaət imkanı: ${insights.analysis.potentialSavingAzn.toFixed(2)} AZN

GÜNLƏR ÜZRƏ MƏLUMAT
${dayLines}

GEMINI ÜÇÜN TAPŞIRIQ
${periodInstruction(period)}
Bu məlumatları Azərbaycan dilində, enerji sahəsindən heç başı çıxmayan biznes sahibinin anlayacağı formada analiz et. Qısa cümlələr və gündəlik sözlər istifadə et. kW və kWh kimi vahidlərin biznes üçün mənasını sadə izah et. Ən vacib pul və enerji məlumatlarını əvvəl yaz. Çıxışda: 1) qısa xülasə, 2) ən vacib müşahidə, 3) prioritet üzrə ən çox 3 konkret addım, 4) mümkün qənaət və 5) məlumat məhdudiyyəti olsun. Məlumatda olmayan faktları uydurma və elektrik nasazlığı barədə qəti diaqnoz vermə.`;
}

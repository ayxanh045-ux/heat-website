import { ELECTRICITY_TARIFF_AZN_PER_KWH } from "@/lib/electricity";

export type EnergySettings = {
  monthlyBudgetAzn: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  peakThresholdKw: number;
  budgetWarningPercent: number;
  alertBudget: boolean;
  alertAfterHours: boolean;
  alertPeak: boolean;
  alertAnomaly: boolean;
};

export const DEFAULT_ENERGY_SETTINGS: EnergySettings = {
  monthlyBudgetAzn: 500,
  workingHoursStart: "08:00",
  workingHoursEnd: "22:00",
  peakThresholdKw: 10,
  budgetWarningPercent: 80,
  alertBudget: true,
  alertAfterHours: true,
  alertPeak: true,
  alertAnomaly: true,
};

export type DailyEnergyRow = { localDate: string; energyKwh: number; costAzn: number };
export type EnergySnapshot = {
  measuredAt: string;
  totalPowerKw: number;
  phaseAKw: number | null;
  phaseBKw: number | null;
  phaseCKw: number | null;
  totalEnergyKwh: number | null;
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const hhmmToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

function isAfterHours(timestamp: string, settings: EnergySettings): boolean {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]));
  const minute = Number(parts.hour) * 60 + Number(parts.minute);
  const start = hhmmToMinutes(settings.workingHoursStart);
  const end = hhmmToMinutes(settings.workingHoursEnd);
  const open = end > start ? minute >= start && minute < end : minute >= start || minute < end;
  return !open;
}

function dateOffset(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function periodTotal(rows: DailyEnergyRow[], start: string, stopExclusive: string): number {
  return sum(rows.filter((row) => row.localDate >= start && row.localDate < stopExclusive).map((row) => row.energyKwh));
}

export function buildCustomerInsights(
  rows: DailyEnergyRow[],
  snapshots: EnergySnapshot[],
  settings: EnergySettings,
  todayKey: string,
) {
  const tariff = ELECTRICITY_TARIFF_AZN_PER_KWH;
  const sortedRows = [...rows].sort((a, b) => a.localDate.localeCompare(b.localDate));
  const rowMap = new Map(sortedRows.map((row) => [row.localDate, row]));
  const today = rowMap.get(todayKey)?.energyKwh ?? 0;
  const yesterdayKey = dateOffset(todayKey, -1);
  const yesterday = rowMap.get(yesterdayKey)?.energyKwh ?? 0;
  const current7Start = dateOffset(todayKey, -7);
  const previous7Start = dateOffset(todayKey, -14);
  const previous7Stop = current7Start;
  const current7 = periodTotal(sortedRows, current7Start, todayKey);
  const previous7 = periodTotal(sortedRows, previous7Start, previous7Stop);
  const monthStart = `${todayKey.slice(0, 7)}-01`;
  const monthToDate = periodTotal(sortedRows, monthStart, dateOffset(todayKey, 1));
  const [year, month, day] = todayKey.split("-").map(Number);
  const previousMonthEnd = new Date(Date.UTC(year, month - 1, 0));
  const previousMonthStart = `${previousMonthEnd.getUTCFullYear()}-${String(previousMonthEnd.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const previousEquivalentStop = `${previousMonthEnd.getUTCFullYear()}-${String(previousMonthEnd.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(day + 1, previousMonthEnd.getUTCDate() + 1)).padStart(2, "0")}`;
  const previousMonthComparable = periodTotal(sortedRows, previousMonthStart, previousEquivalentStop);
  const currentAverage = current7 / Math.max(1, sortedRows.filter((row) => row.localDate >= current7Start && row.localDate < todayKey).length);
  const previousAverage = previous7 / Math.max(1, sortedRows.filter((row) => row.localDate >= previous7Start && row.localDate < previous7Stop).length);
  const dailySavingKwh = Math.max(0, previousAverage - currentAverage);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const savingKwh = dailySavingKwh * daysInMonth;
  const savingAzn = savingKwh * tariff;
  const savingPercent = previousAverage > 0 ? dailySavingKwh / previousAverage * 100 : 0;

  const sortedSnapshots = [...snapshots].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  let afterHoursKwh = 0;
  const hourly = new Map<number, { energy: number; peak: number; samples: number }>();
  for (let index = 1; index < sortedSnapshots.length; index += 1) {
    const previous = sortedSnapshots[index - 1];
    const current = sortedSnapshots[index];
    const elapsedHours = Math.max(0, Math.min(0.5, (new Date(current.measuredAt).getTime() - new Date(previous.measuredAt).getTime()) / 3_600_000));
    const counterDelta = current.totalEnergyKwh != null && previous.totalEnergyKwh != null
      ? current.totalEnergyKwh - previous.totalEnergyKwh
      : Number.NaN;
    const energy = Number.isFinite(counterDelta) && counterDelta >= 0 && counterDelta < 1000
      ? counterDelta
      : ((previous.totalPowerKw + current.totalPowerKw) / 2) * elapsedHours;
    if (isAfterHours(current.measuredAt, settings)) afterHoursKwh += Math.max(0, energy);
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baku", hour: "2-digit", hourCycle: "h23" }).format(new Date(current.measuredAt)));
    const entry = hourly.get(hour) ?? { energy: 0, peak: 0, samples: 0 };
    entry.energy += Math.max(0, energy);
    entry.peak = Math.max(entry.peak, current.totalPowerKw);
    entry.samples += 1;
    hourly.set(hour, entry);
  }
  const peakHours = [...hourly.entries()].map(([hour, value]) => ({
    hour: `${String(hour).padStart(2, "0")}:00`, energyKwh: round(value.energy), costAzn: round(value.energy * tariff), peakKw: round(value.peak),
  })).sort((a, b) => b.energyKwh - a.energyKwh).slice(0, 3);
  const measuredPeakKw = Math.max(0, ...sortedSnapshots.map((item) => item.totalPowerKw));
  const afterHoursCostAzn = afterHoursKwh * tariff;
  const afterHoursShare = monthToDate > 0 ? afterHoursKwh / monthToDate * 100 : 0;
  const budgetUsedAzn = monthToDate * tariff;
  const budgetPercent = settings.monthlyBudgetAzn > 0 ? budgetUsedAzn / settings.monthlyBudgetAzn * 100 : 0;
  const projectedCostAzn = day > 0 ? budgetUsedAzn / day * daysInMonth : budgetUsedAzn;
  const peakPenalty = settings.peakThresholdKw > 0 && measuredPeakKw > settings.peakThresholdKw ? Math.min(20, (measuredPeakKw / settings.peakThresholdKw - 1) * 25) : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - Math.min(30, afterHoursShare * 0.7) - peakPenalty - (savingPercent === 0 ? 5 : 0))));
  const scoreLabel = score >= 85 ? "Çox yaxşı" : score >= 70 ? "Yaxşı" : score >= 50 ? "Diqqət tələb edir" : "Təkmilləşdirmə lazımdır";
  const potentialSavingAzn = Math.max(afterHoursCostAzn * 0.65, settings.peakThresholdKw > 0 && measuredPeakKw > settings.peakThresholdKw ? (measuredPeakKw - settings.peakThresholdKw) * tariff * 12 : 0);
  const recommendations = [
    afterHoursKwh > 0.5 ? `İş saatından sonra ölçülən ${round(afterHoursKwh, 1)} kWh sərfiyyatı yoxlayın; təxmini ${round(afterHoursCostAzn * 0.65)} AZN qənaət potensialı var.` : "İş saatından sonrakı baza yükü nəzarətdədir.",
    settings.peakThresholdKw > 0 && measuredPeakKw > settings.peakThresholdKw ? `Pik yük ${round(measuredPeakKw)} kW olub. Yüksək güclü avadanlıqları 10–15 dəqiqə fərqlə işə salın.` : "Pik güc təyin edilmiş hədd daxilindədir.",
    savingPercent > 0 ? `Son 7 gündə gündəlik orta sərfiyyat əvvəlki dövrlə müqayisədə ${round(savingPercent, 1)}% azalıb.` : "Qənaət trendi yaratmaq üçün gecə və pik yüklərinə fokuslanın.",
  ];

  const compare = (current: number, previous: number) => ({
    currentKwh: round(current), previousKwh: round(previous), differenceKwh: round(current - previous),
    differenceAzn: round((current - previous) * tariff), percent: previous > 0 ? round((current - previous) / previous * 100, 1) : 0,
  });

  return {
    savings: { energyKwh: round(savingKwh), amountAzn: round(savingAzn), percent: round(savingPercent, 1), baseline: "Əvvəlki 7 günün gündəlik ortası" },
    budget: { limitAzn: settings.monthlyBudgetAzn, usedAzn: round(budgetUsedAzn), remainingAzn: round(Math.max(0, settings.monthlyBudgetAzn - budgetUsedAzn)), percent: round(budgetPercent, 1), projectedAzn: round(projectedCostAzn), warning: budgetPercent >= settings.budgetWarningPercent },
    comparisons: { daily: compare(today, yesterday), weekly: compare(current7, previous7), monthly: compare(monthToDate, previousMonthComparable) },
    afterHours: { energyKwh: round(afterHoursKwh), amountAzn: round(afterHoursCostAzn), sharePercent: round(afterHoursShare, 1), projectedMonthlyAzn: round(day > 0 ? afterHoursCostAzn / day * daysInMonth : afterHoursCostAzn) },
    peaks: { measuredPeakKw: round(measuredPeakKw), thresholdKw: settings.peakThresholdKw, hours: peakHours },
    score: { value: score, label: scoreLabel },
    analysis: { potentialSavingAzn: round(potentialSavingAzn), recommendations, likelySource: peakHours[0] ? `${peakHours[0].hour} intervalında və ən yüksək yüklənən fazada` : "Kifayət qədər saatlıq məlumat yoxdur" },
    settings,
  };
}

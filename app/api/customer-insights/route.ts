import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { customerDailyEnergy, customerEnergySettings, customerEnergySnapshots } from "@/db/schema";
import { getCustomerSession } from "@/lib/customer-auth";
import { buildCustomerInsights, DEFAULT_ENERGY_SETTINGS, type DailyEnergyRow, type EnergySnapshot } from "@/lib/customer-insights";
import { bakuDateKey, DEMO_CUSTOMER, demoEnergyForDate } from "@/lib/demo-customer";
import { ELECTRICITY_TARIFF_AZN_PER_KWH } from "@/lib/electricity";

function dateOffset(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function demoRows(today: string): DailyEnergyRow[] {
  return Array.from({ length: 70 }, (_, index) => {
    const localDate = dateOffset(today, index - 69);
    const energyKwh = demoEnergyForDate(localDate) * (index < 56 ? 1.08 : 1);
    return { localDate, energyKwh, costAzn: energyKwh * ELECTRICITY_TARIFF_AZN_PER_KWH };
  });
}

function demoSnapshots(today: string): EnergySnapshot[] {
  let cumulative = 12_000;
  return Array.from({ length: 97 }, (_, index) => {
    const hour = index / 4;
    const afterHours = hour < 8 || hour >= 22;
    const evening = hour >= 17 && hour < 22;
    const power = afterHours ? 1.1 + (index % 5) * 0.08 : evening ? 9.2 + (index % 7) * 0.52 : 5.2 + (index % 9) * 0.31;
    cumulative += power / 4;
    return {
      measuredAt: new Date(`${today}T00:00:00+04:00`).getTime() + index * 15 * 60_000,
      totalPowerKw: power,
      phaseAKw: power * 0.43,
      phaseBKw: power * 0.32,
      phaseCKw: power * 0.25,
      totalEnergyKwh: cumulative,
    };
  }).map((row) => ({ ...row, measuredAt: new Date(row.measuredAt).toISOString() }));
}

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const today = bakuDateKey();
  const db = getDb();
  const [savedSettings] = await db.select().from(customerEnergySettings).where(eq(customerEnergySettings.customerId, session.customerId)).limit(1);
  const settings = savedSettings ? {
    monthlyBudgetAzn: savedSettings.monthlyBudgetAzn,
    workingHoursStart: savedSettings.workingHoursStart,
    workingHoursEnd: savedSettings.workingHoursEnd,
    peakThresholdKw: savedSettings.peakThresholdKw,
    budgetWarningPercent: savedSettings.budgetWarningPercent,
    alertBudget: savedSettings.alertBudget,
    alertAfterHours: savedSettings.alertAfterHours,
    alertPeak: savedSettings.alertPeak,
    alertAnomaly: savedSettings.alertAnomaly,
  } : DEFAULT_ENERGY_SETTINGS;
  if (session.customerId === DEMO_CUSTOMER.id) {
    return Response.json(buildCustomerInsights(demoRows(today), demoSnapshots(today), settings, today));
  }
  const historyStart = dateOffset(today, -70);
  const snapshotStart = new Date(`${today.slice(0, 7)}-01T00:00:00+04:00`).toISOString();
  const [rows, snapshots] = await Promise.all([
    db.select({ localDate: customerDailyEnergy.localDate, energyKwh: customerDailyEnergy.energyKwh, costAzn: customerDailyEnergy.costAzn })
      .from(customerDailyEnergy).where(and(eq(customerDailyEnergy.customerId, session.customerId), gte(customerDailyEnergy.localDate, historyStart))).orderBy(asc(customerDailyEnergy.localDate)),
    db.select({ measuredAt: customerEnergySnapshots.measuredAt, totalPowerKw: customerEnergySnapshots.totalPowerKw, phaseAKw: customerEnergySnapshots.phaseAKw, phaseBKw: customerEnergySnapshots.phaseBKw, phaseCKw: customerEnergySnapshots.phaseCKw, totalEnergyKwh: customerEnergySnapshots.totalEnergyKwh })
      .from(customerEnergySnapshots).where(and(eq(customerEnergySnapshots.customerId, session.customerId), gte(customerEnergySnapshots.measuredAt, snapshotStart))).orderBy(asc(customerEnergySnapshots.measuredAt)),
  ]);
  return Response.json(buildCustomerInsights(rows, snapshots, settings, today));
}

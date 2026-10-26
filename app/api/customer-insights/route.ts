import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { customerDailyEnergy, customerEnergySettings, customerEnergySnapshots } from "@/db/schema";
import { getCustomerSession } from "@/lib/customer-auth";
import { buildCustomerInsights, DEFAULT_ENERGY_SETTINGS } from "@/lib/customer-insights";
import { bakuDateKey, DEMO_CUSTOMER } from "@/lib/demo-customer";
import { demoInsightRows, demoInsightSnapshots } from "@/lib/demo-customer-insights";

export const dynamic = "force-dynamic";

function dateOffset(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "cache-control": "no-store, private" } });
    }
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
      return Response.json(
        buildCustomerInsights(demoInsightRows(today), demoInsightSnapshots(today), settings, today),
        { headers: { "cache-control": "no-store, private" } },
      );
    }

    const historyStart = dateOffset(today, -70);
    const snapshotStart = new Date(`${today.slice(0, 7)}-01T00:00:00+04:00`).toISOString();
    const [rows, snapshots] = await Promise.all([
      db.select({ localDate: customerDailyEnergy.localDate, energyKwh: customerDailyEnergy.energyKwh, costAzn: customerDailyEnergy.costAzn })
        .from(customerDailyEnergy).where(and(eq(customerDailyEnergy.customerId, session.customerId), gte(customerDailyEnergy.localDate, historyStart))).orderBy(asc(customerDailyEnergy.localDate)),
      db.select({ measuredAt: customerEnergySnapshots.measuredAt, totalPowerKw: customerEnergySnapshots.totalPowerKw, phaseAKw: customerEnergySnapshots.phaseAKw, phaseBKw: customerEnergySnapshots.phaseBKw, phaseCKw: customerEnergySnapshots.phaseCKw, totalEnergyKwh: customerEnergySnapshots.totalEnergyKwh })
        .from(customerEnergySnapshots).where(and(eq(customerEnergySnapshots.customerId, session.customerId), gte(customerEnergySnapshots.measuredAt, snapshotStart))).orderBy(asc(customerEnergySnapshots.measuredAt)),
    ]);
    return Response.json(
      buildCustomerInsights(rows, snapshots, settings, today),
      { headers: { "cache-control": "no-store, private" } },
    );
  } catch {
    return Response.json(
      { error: "Analitika məlumatları oxuna bilmədi." },
      { status: 500, headers: { "cache-control": "no-store, private" } },
    );
  }
}

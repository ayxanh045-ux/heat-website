import { and, eq, gte, lte, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { customerDailyEnergy } from "@/db/schema";
import { getCustomerSession } from "@/lib/customer-auth";
import { bakuDateKey, DEMO_CUSTOMER, demoEnergyForDate } from "@/lib/demo-customer";
import { ELECTRICITY_TARIFF_AZN_PER_KWH } from "@/lib/electricity";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const selectedDate = new URL(request.url).searchParams.get("date") ?? "";
  const today = bakuDateKey();
  if (!DATE_KEY.test(selectedDate) || selectedDate > today) return Response.json({ error: "Invalid date" }, { status: 400 });
  const monthStart = `${today.slice(0, 7)}-01`;

  if (session.customerId === DEMO_CUSTOMER.id) {
    const energyKwh = demoEnergyForDate(selectedDate);
    const day = Number(today.slice(8, 10));
    const monthEnergyKwh = Array.from({ length: day }, (_, index) => demoEnergyForDate(`${today.slice(0, 8)}${String(index + 1).padStart(2, "0")}`))
      .reduce((total, value) => total + value, 0);
    return Response.json({ selected: { energyKwh, costAzn: energyKwh * ELECTRICITY_TARIFF_AZN_PER_KWH }, monthToDate: { energyKwh: monthEnergyKwh, costAzn: monthEnergyKwh * ELECTRICITY_TARIFF_AZN_PER_KWH }, source: "demo" });
  }

  const db = getDb();
  const [selected] = await db.select({ energyKwh: sum(customerDailyEnergy.energyKwh), costAzn: sum(customerDailyEnergy.costAzn) })
    .from(customerDailyEnergy).where(and(eq(customerDailyEnergy.customerId, session.customerId), eq(customerDailyEnergy.localDate, selectedDate)));
  const [month] = await db.select({ energyKwh: sum(customerDailyEnergy.energyKwh), costAzn: sum(customerDailyEnergy.costAzn) })
    .from(customerDailyEnergy).where(and(eq(customerDailyEnergy.customerId, session.customerId), gte(customerDailyEnergy.localDate, monthStart), lte(customerDailyEnergy.localDate, today)));
  return Response.json({
    selected: selected?.energyKwh === null ? null : { energyKwh: Number(selected.energyKwh), costAzn: Number(selected.costAzn) },
    monthToDate: { energyKwh: Number(month?.energyKwh ?? 0), costAzn: Number(month?.costAzn ?? 0) },
    source: "influx-sync",
  });
}

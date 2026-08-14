import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerEnergySettings, customers } from "@/db/schema";
import { DEFAULT_ENERGY_SETTINGS } from "@/lib/customer-insights";
import { agentIsAuthorized } from "@/lib/provisioning";

export async function GET(request: Request) {
  if (!(await agentIsAuthorized(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const slug = new URL(request.url).searchParams.get("slug")?.slice(0, 50) ?? "";
  const db = getDb();
  const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.slug, slug)).limit(1);
  if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
  const [saved] = await db.select().from(customerEnergySettings).where(eq(customerEnergySettings.customerId, customer.id)).limit(1);
  return Response.json(saved ? {
    monthlyBudgetAzn: saved.monthlyBudgetAzn,
    workingHoursStart: saved.workingHoursStart,
    workingHoursEnd: saved.workingHoursEnd,
    peakThresholdKw: saved.peakThresholdKw,
    budgetWarningPercent: saved.budgetWarningPercent,
    alertBudget: saved.alertBudget,
    alertAfterHours: saved.alertAfterHours,
    alertPeak: saved.alertPeak,
    alertAnomaly: saved.alertAnomaly,
  } : DEFAULT_ENERGY_SETTINGS);
}

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerEnergySettings } from "@/db/schema";
import { getCustomerSession } from "@/lib/customer-auth";
import { DEFAULT_ENERGY_SETTINGS, type EnergySettings } from "@/lib/customer-insights";
import { requestIsSameOrigin } from "@/lib/provisioning";

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function normalize(raw: unknown): EnergySettings {
  if (!raw || typeof raw !== "object") throw new Error("Parametrlər düzgün deyil.");
  const input = raw as Record<string, unknown>;
  const monthlyBudgetAzn = Number(input.monthlyBudgetAzn);
  const peakThresholdKw = Number(input.peakThresholdKw);
  const budgetWarningPercent = Number(input.budgetWarningPercent);
  const workingHoursStart = String(input.workingHoursStart ?? "");
  const workingHoursEnd = String(input.workingHoursEnd ?? "");
  if (!Number.isFinite(monthlyBudgetAzn) || monthlyBudgetAzn < 10 || monthlyBudgetAzn > 1_000_000) throw new Error("Aylıq büdcə düzgün deyil.");
  if (!Number.isFinite(peakThresholdKw) || peakThresholdKw < 0.1 || peakThresholdKw > 10_000) throw new Error("Pik həddi düzgün deyil.");
  if (!Number.isInteger(budgetWarningPercent) || budgetWarningPercent < 50 || budgetWarningPercent > 100) throw new Error("Büdcə xəbərdarlığı 50–100% aralığında olmalıdır.");
  if (!TIME.test(workingHoursStart) || !TIME.test(workingHoursEnd) || workingHoursStart === workingHoursEnd) throw new Error("İş saatlarını düzgün daxil edin.");
  return {
    monthlyBudgetAzn, peakThresholdKw, budgetWarningPercent, workingHoursStart, workingHoursEnd,
    alertBudget: input.alertBudget === true,
    alertAfterHours: input.alertAfterHours === true,
    alertPeak: input.alertPeak === true,
    alertAnomaly: input.alertAnomaly === true,
  };
}

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [saved] = await getDb().select().from(customerEnergySettings).where(eq(customerEnergySettings.customerId, session.customerId)).limit(1);
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

export async function PUT(request: Request) {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const settings = normalize(await request.json());
    const now = new Date().toISOString();
    await getDb().insert(customerEnergySettings).values({ customerId: session.customerId, ...settings, updatedAt: now })
      .onConflictDoUpdate({ target: customerEnergySettings.customerId, set: { ...settings, updatedAt: now } });
    return Response.json({ ok: true, settings });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Parametrlər saxlanmadı." }, { status: 400 });
  }
}

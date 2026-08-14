import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerEnergySettings } from "@/db/schema";
import { DEFAULT_ENERGY_SETTINGS, type EnergySettings } from "@/lib/customer-insights";

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validateEnergySettings(raw: unknown): EnergySettings {
  if (!raw || typeof raw !== "object") throw new Error("Parametrlər düzgün deyil.");
  const input = raw as Record<string, unknown>;
  const monthlyBudgetAzn = Number(input.monthlyBudgetAzn);
  const peakThresholdKw = Number(input.peakThresholdKw);
  const budgetWarningPercent = Number(input.budgetWarningPercent);
  const workingHoursStart = String(input.workingHoursStart ?? "");
  const workingHoursEnd = String(input.workingHoursEnd ?? "");
  if (!Number.isFinite(monthlyBudgetAzn) || monthlyBudgetAzn < 10 || monthlyBudgetAzn > 1_000_000) throw new Error("Aylıq büdcə 10–1 000 000 AZN aralığında olmalıdır.");
  if (!Number.isFinite(peakThresholdKw) || peakThresholdKw < 0.1 || peakThresholdKw > 10_000) throw new Error("Pik həddi düzgün deyil.");
  if (!Number.isInteger(budgetWarningPercent) || budgetWarningPercent < 50 || budgetWarningPercent > 100) throw new Error("Büdcə xəbərdarlığı 50–100% aralığında olmalıdır.");
  if (!TIME.test(workingHoursStart) || !TIME.test(workingHoursEnd) || workingHoursStart === workingHoursEnd) throw new Error("İş saatlarını HH:MM formatında və fərqli daxil edin.");
  return {
    monthlyBudgetAzn, peakThresholdKw, budgetWarningPercent, workingHoursStart, workingHoursEnd,
    alertBudget: input.alertBudget === true,
    alertAfterHours: input.alertAfterHours === true,
    alertPeak: input.alertPeak === true,
    alertAnomaly: input.alertAnomaly === true,
  };
}

export async function getCustomerEnergySettings(customerId: string): Promise<EnergySettings> {
  const [saved] = await getDb().select().from(customerEnergySettings).where(eq(customerEnergySettings.customerId, customerId)).limit(1);
  if (!saved) return { ...DEFAULT_ENERGY_SETTINGS };
  return {
    monthlyBudgetAzn: saved.monthlyBudgetAzn,
    workingHoursStart: saved.workingHoursStart,
    workingHoursEnd: saved.workingHoursEnd,
    peakThresholdKw: saved.peakThresholdKw,
    budgetWarningPercent: saved.budgetWarningPercent,
    alertBudget: saved.alertBudget,
    alertAfterHours: saved.alertAfterHours,
    alertPeak: saved.alertPeak,
    alertAnomaly: saved.alertAnomaly,
  };
}

export async function saveCustomerEnergySettings(customerId: string, raw: unknown): Promise<EnergySettings> {
  const settings = validateEnergySettings(raw);
  const now = new Date().toISOString();
  await getDb().insert(customerEnergySettings).values({ customerId, ...settings, updatedAt: now })
    .onConflictDoUpdate({ target: customerEnergySettings.customerId, set: { ...settings, updatedAt: now } });
  return settings;
}

export async function updateCustomerEnergySettings(customerId: string, patch: Partial<EnergySettings>): Promise<EnergySettings> {
  const current = await getCustomerEnergySettings(customerId);
  return saveCustomerEnergySettings(customerId, { ...current, ...patch });
}

export function parseBudgetAmount(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 10 || amount > 1_000_000) throw new Error("Büdcəni 10–1 000 000 AZN aralığında yazın. Nümunə: /setbudget 750");
  return amount;
}

export function parseWorkingHours(start: string, end: string): Pick<EnergySettings, "workingHoursStart" | "workingHoursEnd"> {
  if (!TIME.test(start) || !TIME.test(end) || start === end) throw new Error("İş saatlarını belə yazın: /sethours 09:00 23:00");
  return { workingHoursStart: start, workingHoursEnd: end };
}

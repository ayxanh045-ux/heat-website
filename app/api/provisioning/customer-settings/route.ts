import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { getCustomerEnergySettings, updateCustomerEnergySettings } from "@/lib/customer-energy-settings";
import type { EnergySettings } from "@/lib/customer-insights";
import { agentCanAccessSlug, getAgentPrincipal } from "@/lib/provisioning";

async function customerIdForSlug(slug: string): Promise<string | null> {
  const [customer] = await getDb().select({ id: customers.id }).from(customers).where(eq(customers.slug, slug)).limit(1);
  return customer?.id ?? null;
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.slice(0, 50) ?? "";
  const principal = await getAgentPrincipal(request);
  if (!principal || !agentCanAccessSlug(principal, slug)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const customerId = await customerIdForSlug(slug);
  if (!customerId) return Response.json({ error: "Customer not found" }, { status: 404 });
  return Response.json(await getCustomerEnergySettings(customerId));
}

export async function PUT(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.slice(0, 50) ?? "";
  const principal = await getAgentPrincipal(request);
  if (!principal || !agentCanAccessSlug(principal, slug)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const customerId = await customerIdForSlug(slug);
  if (!customerId) return Response.json({ error: "Customer not found" }, { status: 404 });
  try {
    const input = await request.json() as Record<string, unknown>;
    const patch: Partial<EnergySettings> = {};
    if ("monthlyBudgetAzn" in input) patch.monthlyBudgetAzn = Number(input.monthlyBudgetAzn);
    if ("workingHoursStart" in input) patch.workingHoursStart = String(input.workingHoursStart);
    if ("workingHoursEnd" in input) patch.workingHoursEnd = String(input.workingHoursEnd);
    if (Object.keys(patch).length === 0) return Response.json({ error: "No supported settings supplied" }, { status: 400 });
    return Response.json(await updateCustomerEnergySettings(customerId, patch));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Settings were not saved" }, { status: 400 });
  }
}

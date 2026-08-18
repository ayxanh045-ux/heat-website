import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerDailyEnergy, customers } from "@/db/schema";
import { ELECTRICITY_TARIFF_AZN_PER_KWH } from "@/lib/electricity";
import { agentCanAccessSlug, getAgentPrincipal } from "@/lib/provisioning";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function clean(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { slug?: unknown; summaries?: unknown };
    const slug = clean(body.slug, 50);
    const principal = await getAgentPrincipal(request);
    if (!principal || !agentCanAccessSlug(principal, slug)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const summaries = Array.isArray(body.summaries) ? body.summaries.slice(0, 450) : [];
    const db = getDb();
    const [customer] = await db.select({ id: customers.id, deviceId: customers.deviceId }).from(customers).where(eq(customers.slug, slug)).limit(1);
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    const now = new Date().toISOString();
    let accepted = 0;
    for (const raw of summaries) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const deviceId = clean(item.deviceId, 80);
      const localDate = clean(item.localDate, 10);
      const energyKwh = Number(item.energyKwh);
      if (deviceId !== customer.deviceId || !DATE_KEY.test(localDate) || !Number.isFinite(energyKwh) || energyKwh < 0 || energyKwh > 1_000_000) continue;
      const costAzn = energyKwh * ELECTRICITY_TARIFF_AZN_PER_KWH;
      const id = `${customer.id}:${deviceId}:${localDate}`;
      await db.insert(customerDailyEnergy).values({ id, customerId: customer.id, deviceId, localDate, energyKwh, costAzn, updatedAt: now })
        .onConflictDoUpdate({
          target: [customerDailyEnergy.customerId, customerDailyEnergy.deviceId, customerDailyEnergy.localDate],
          set: { energyKwh, costAzn, updatedAt: now },
        });
      accepted += 1;
    }
    return Response.json({ ok: true, accepted });
  } catch {
    return Response.json({ error: "Energy payload is invalid" }, { status: 400 });
  }
}

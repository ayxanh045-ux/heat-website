import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { customerEnergySnapshots, customers } from "@/db/schema";
import { agentIsAuthorized } from "@/lib/provisioning";

const clean = (value: unknown, maximum: number) => typeof value === "string" ? value.trim().slice(0, maximum) : "";
const metric = (value: unknown, minimum: number, maximum: number, nullable = false) => {
  if (nullable && (value === null || value === undefined)) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : Number.NaN;
};

export async function POST(request: Request) {
  if (!(await agentIsAuthorized(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { slug?: unknown; snapshots?: unknown };
    const slug = clean(body.slug, 50);
    const incoming = Array.isArray(body.snapshots) ? body.snapshots.slice(0, 500) : [];
    const db = getDb();
    const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.slug, slug)).limit(1);
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    let accepted = 0;
    for (const raw of incoming) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      const deviceId = clean(item.deviceId, 80);
      const measuredAt = clean(item.measuredAt, 40);
      const timestamp = new Date(measuredAt);
      const totalPowerKw = metric(item.totalPowerKw, 0, 100_000);
      const phaseAKw = metric(item.phaseAKw, 0, 100_000, true);
      const phaseBKw = metric(item.phaseBKw, 0, 100_000, true);
      const phaseCKw = metric(item.phaseCKw, 0, 100_000, true);
      const totalEnergyKwh = metric(item.totalEnergyKwh, 0, 1_000_000_000, true);
      if (!deviceId || Number.isNaN(timestamp.getTime()) || timestamp.getTime() > Date.now() + 300_000 || Number.isNaN(totalPowerKw) || [phaseAKw, phaseBKw, phaseCKw, totalEnergyKwh].some(Number.isNaN)) continue;
      const normalizedAt = timestamp.toISOString();
      const id = `${customer.id}:${deviceId}:${normalizedAt}`;
      await db.insert(customerEnergySnapshots).values({ id, customerId: customer.id, deviceId, measuredAt: normalizedAt, totalPowerKw, phaseAKw, phaseBKw, phaseCKw, totalEnergyKwh })
        .onConflictDoUpdate({ target: [customerEnergySnapshots.customerId, customerEnergySnapshots.deviceId, customerEnergySnapshots.measuredAt], set: { totalPowerKw, phaseAKw, phaseBKw, phaseCKw, totalEnergyKwh } });
      accepted += 1;
    }
    const retentionCutoff = new Date(Date.now() - 120 * 86400000).toISOString();
    await db.delete(customerEnergySnapshots).where(and(eq(customerEnergySnapshots.customerId, customer.id), lt(customerEnergySnapshots.measuredAt, retentionCutoff)));
    return Response.json({ ok: true, accepted });
  } catch {
    return Response.json({ error: "Snapshot payload is invalid" }, { status: 400 });
  }
}

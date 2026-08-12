import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, customerSystemHealth } from "@/db/schema";
import { notifyAdminBot } from "@/lib/admin-bot";
import { agentIsAuthorized } from "@/lib/provisioning";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";

type HealthItem = {
  slug?: unknown;
  status?: unknown;
  message?: unknown;
  services?: unknown;
};

const ALLOWED_STATUS = new Set(["healthy", "degraded", "unhealthy"]);

function clean(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  if (!(await agentIsAuthorized(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { customers?: HealthItem[] };
    const items = Array.isArray(body.customers) ? body.customers.slice(0, 100) : [];
    const db = getDb();
    const now = new Date().toISOString();
    let accepted = 0;
    let alerts = 0;

    await db.insert(customerSystemHealth).values({
      customerId: DEMO_CUSTOMER.id,
      status: "healthy",
      statusMessage: "Virtual demo məlumat axını aktivdir.",
      servicesJson: JSON.stringify({ dashboard: "healthy", telegram: "healthy", demoGenerator: "healthy" }),
      lastHeartbeatAt: now,
      lastStatusChangeAt: now,
    }).onConflictDoUpdate({
      target: customerSystemHealth.customerId,
      set: {
        status: "healthy",
        statusMessage: "Virtual demo məlumat axını aktivdir.",
        servicesJson: JSON.stringify({ dashboard: "healthy", telegram: "healthy", demoGenerator: "healthy" }),
        lastHeartbeatAt: now,
      },
    });
    accepted += 1;

    for (const item of items) {
      const slug = clean(item.slug, 50);
      const status = clean(item.status, 20);
      if (!slug || !ALLOWED_STATUS.has(status)) continue;
      const [customer] = await db.select().from(customers).where(eq(customers.slug, slug)).limit(1);
      if (!customer) continue;
      const [previous] = await db.select().from(customerSystemHealth)
        .where(eq(customerSystemHealth.customerId, customer.id)).limit(1);
      const message = clean(item.message, 500);
      const services = Object.fromEntries(Object.entries(
        item.services && typeof item.services === "object" ? item.services as Record<string, unknown> : {},
      ).sort(([left], [right]) => left.localeCompare(right)));
      const servicesJson = JSON.stringify(services).slice(0, 4000);
      const changed = previous
        ? previous.status !== status || previous.statusMessage !== (message || null) || previous.servicesJson !== servicesJson
        : status !== "healthy";
      await db.insert(customerSystemHealth).values({
        customerId: customer.id,
        status,
        statusMessage: message || null,
        servicesJson,
        lastHeartbeatAt: now,
        lastStatusChangeAt: changed ? now : previous?.lastStatusChangeAt ?? now,
      }).onConflictDoUpdate({
        target: customerSystemHealth.customerId,
        set: {
          status,
          statusMessage: message || null,
          servicesJson,
          lastHeartbeatAt: now,
          ...(changed ? { lastStatusChangeAt: now } : {}),
        },
      });
      accepted += 1;

      if (changed) {
        const serviceLines = Object.entries(services)
          .slice(0, 12).map(([name, value]) => `• ${name}: ${String(value).slice(0, 40)}`).join("\n");
        const recovery = status === "healthy";
        const result = await notifyAdminBot({
          customerId: customer.id,
          eventType: recovery ? "system_recovered" : "system_problem",
          message: `${recovery ? "✅" : "🚨"} HEAT Admin — ${recovery ? "Sistem bərpa olundu" : "Müştəri sistemində problem"}\n\nMüştəri: ${customer.customerName}\nObyekt: ${customer.siteName}\nStatus: ${status}${message ? `\nSəbəb: ${message}` : ""}${serviceLines ? `\n\nXidmətlər:\n${serviceLines}` : ""}\n\nVaxt: ${now}`,
        });
        if (result.delivered) alerts += 1;
      }
    }
    return Response.json({ ok: true, accepted, alerts });
  } catch {
    return Response.json({ error: "Health payload is invalid" }, { status: 400 });
  }
}

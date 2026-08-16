import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { adminBotEvents } from "@/db/schema";
import { notifyAdminBot } from "@/lib/admin-bot";
import { agentIsAuthorized } from "@/lib/provisioning";

const SOURCE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  if (!(await agentIsAuthorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim().slice(0, 50) : "";
    const status = body.status === "healthy" ? "healthy" : body.status === "unhealthy" ? "unhealthy" : "";
    const detail = typeof body.message === "string" ? body.message.trim().slice(0, 300) : "";
    if (!SOURCE_ID.test(sourceId) || !status) {
      return Response.json({ error: "Invalid watchdog heartbeat" }, { status: 400 });
    }

    const problemType = `watchdog_problem_${sourceId}`;
    const recoveryType = `watchdog_recovered_${sourceId}`;
    const [latest] = await getDb().select({
      eventType: adminBotEvents.eventType,
      outcome: adminBotEvents.outcome,
    }).from(adminBotEvents)
      .where(inArray(adminBotEvents.eventType, [problemType, recoveryType]))
      .orderBy(desc(adminBotEvents.createdAt))
      .limit(1);

    const desiredType = status === "healthy" ? recoveryType : problemType;
    if ((!latest && status === "healthy") || (latest?.eventType === desiredType && latest.outcome === "delivered")) {
      return Response.json({ ok: true, adminNotified: false });
    }

    const recovered = status === "healthy";
    const result = await notifyAdminBot({
      eventType: desiredType,
      message: `${recovered ? "✅" : "🚨"} HEAT Admin — Mərkəzi provisioner ${recovered ? "bərpa olundu" : "dayandı"}\n\nServer: ${sourceId}\nStatus: ${status}\n${detail ? `Səbəb: ${detail}\n` : ""}Vaxt: ${new Date().toISOString()}${recovered ? "\n\nMüştəri sistemlərinin avtomatik nəzarəti yenidən aktivdir." : "\n\nWatchdog işləyir, lakin provisioner cavab vermir. Dərhal yoxlama tələb olunur."}`,
    });
    return Response.json({ ok: true, adminNotified: result.delivered });
  } catch {
    return Response.json({ error: "Invalid watchdog heartbeat" }, { status: 400 });
  }
}

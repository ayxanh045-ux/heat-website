import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminBotEvents, adminBotSettings, customerSystemHealth } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import {
  ADMIN_BOT_SETTINGS_ID,
  decryptAdminBotSecret,
  encryptAdminBotSecret,
  validateAdminBotSecret,
} from "@/lib/admin-bot";
import { requestIsSameOrigin } from "@/lib/provisioning";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  const db = getDb();
  const [settings] = await db.select().from(adminBotSettings)
    .where(eq(adminBotSettings.id, ADMIN_BOT_SETTINGS_ID)).limit(1);
  let chatId = "";
  if (settings) {
    try { chatId = (await decryptAdminBotSecret(settings.encryptedPayload)).chatId; } catch { /* keep masked */ }
  }
  const [events, storedHealth] = await Promise.all([
    db.select().from(adminBotEvents).orderBy(desc(adminBotEvents.createdAt)).limit(8),
    db.select().from(customerSystemHealth).orderBy(desc(customerSystemHealth.lastHeartbeatAt)).limit(50),
  ]);
  const health = storedHealth.some((item) => item.customerId === DEMO_CUSTOMER.id)
    ? storedHealth
    : [{
        customerId: DEMO_CUSTOMER.id,
        status: "healthy",
        statusMessage: "Virtual demo məlumat axını aktivdir.",
        servicesJson: JSON.stringify({ dashboard: "healthy", telegram: "healthy", demoGenerator: "healthy" }),
        lastHeartbeatAt: new Date().toISOString(),
        lastStatusChangeAt: new Date().toISOString(),
      }, ...storedHealth];
  return Response.json({
    enabled: settings?.enabled ?? false,
    configured: Boolean(settings),
    chatId,
    events,
    health,
  }, { headers: { "cache-control": "no-store, private" } });
}

export async function PUT(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const body = await request.json() as { enabled?: boolean; botToken?: string; chatId?: string };
    const db = getDb();
    const [existing] = await db.select().from(adminBotSettings)
      .where(eq(adminBotSettings.id, ADMIN_BOT_SETTINGS_ID)).limit(1);
    let botToken = typeof body.botToken === "string" ? body.botToken.trim() : "";
    if (!botToken && existing) botToken = (await decryptAdminBotSecret(existing.encryptedPayload)).botToken;
    const secret = validateAdminBotSecret({ botToken, chatId: body.chatId });
    const encryptedPayload = await encryptAdminBotSecret(secret);
    const now = new Date().toISOString();
    await db.insert(adminBotSettings).values({
      id: ADMIN_BOT_SETTINGS_ID,
      encryptedPayload,
      enabled: body.enabled === true,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: adminBotSettings.id,
      set: { encryptedPayload, enabled: body.enabled === true, updatedAt: now },
    });
    return Response.json({ ok: true, enabled: body.enabled === true, configured: true, chatId: secret.chatId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message.slice(0, 180) : "Admin Bot saxlanmadı." }, { status: 400 });
  }
}

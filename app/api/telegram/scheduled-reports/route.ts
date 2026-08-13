import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminStatusDigestDeliveries, customers, customerSecrets, customerSystemHealth, telegramReportDeliveries } from "@/db/schema";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { callTelegram, demoTelegramReply } from "@/lib/telegram";
import { dueScheduledTime, localDateAndTime, scheduledDeliveryKey } from "@/lib/telegram-scheduler";
import { getAdminUser } from "@/lib/admin-auth";
import { agentIsAuthorized, requestIsSameOrigin } from "@/lib/provisioning";
import { notifyAdminBot } from "@/lib/admin-bot";
import { ADMIN_DIGEST_TIMES, buildAdminHealthDigest } from "@/lib/admin-health-digest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminRequest = requestIsSameOrigin(request) && Boolean(await getAdminUser());
  if (!adminRequest && !(await agentIsAuthorized(request))) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  const db = getDb();
  const now = new Date();
  let sent = 0;
  let adminDigestsSent = 0;

  const baku = localDateAndTime(now, "Asia/Baku");
  const adminDueTime = dueScheduledTime(baku.time, [...ADMIN_DIGEST_TIMES]);
  if (adminDueTime) {
    const scheduledFor = `${baku.date}T${adminDueTime}+04:00`;
    const id = `admin-health:${scheduledFor}`;
    const claimed = await db.insert(adminStatusDigestDeliveries).values({ id, scheduledFor })
      .onConflictDoNothing().returning({ id: adminStatusDigestDeliveries.id });
    if (claimed.length > 0) {
      const systems = await db.select({
        customerId: customers.id,
        customerName: customers.customerName,
        siteName: customers.siteName,
        customerStatus: customers.status,
        healthStatus: customerSystemHealth.status,
        statusMessage: customerSystemHealth.statusMessage,
        lastHeartbeatAt: customerSystemHealth.lastHeartbeatAt,
      }).from(customers).leftJoin(customerSystemHealth, eq(customers.id, customerSystemHealth.customerId));
      const result = await notifyAdminBot({
        eventType: "scheduled_system_health_digest",
        message: buildAdminHealthDigest(systems, now, adminDueTime),
      });
      if (result.delivered) adminDigestsSent += 1;
      else await db.delete(adminStatusDigestDeliveries).where(eq(adminStatusDigestDeliveries.id, id));
    }
  }

  const vaults = await db.select().from(customerSecrets).where(eq(customerSecrets.customerId, DEMO_CUSTOMER.id)).limit(1);
  for (const vault of vaults) {
    let values;
    try { values = await decryptProvisioningInput(vault.encryptedPayload); } catch { continue; }
    if (!values.telegramEnabled || !values.telegramBotToken || !values.telegramDefaultChatId) continue;
    const local = localDateAndTime(now, values.timezone);
    const dueTime = dueScheduledTime(local.time, values.telegramReportTimes.split(","));
    if (!dueTime) continue;

    const scheduledFor = `${local.date}T${dueTime}`;
    const id = scheduledDeliveryKey(vault.customerId, local.date, dueTime);
    const claimed = await db.insert(telegramReportDeliveries).values({ id, customerId: vault.customerId, scheduledFor }).onConflictDoNothing().returning({ id: telegramReportDeliveries.id });
    if (claimed.length === 0) continue;

    try {
      await callTelegram(values.telegramBotToken, "sendMessage", {
        chat_id: values.telegramDefaultChatId,
        text: demoTelegramReply("/report", values, { automatic: true }),
      });
      sent += 1;
      await notifyAdminBot({
        customerId: vault.customerId,
        eventType: "customer_report_delivered",
        message: `✅ HEAT Admin — Avtomatik report göndərildi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nPlanlaşdırılan vaxt: ${dueTime} (${values.timezone})\nNəticə: Müştəri Telegram reportunu qəbul etdi.`,
      });
    } catch (error) {
      await db.delete(telegramReportDeliveries).where(eq(telegramReportDeliveries.id, id));
      await notifyAdminBot({
        customerId: vault.customerId,
        eventType: "customer_report_failed",
        message: `❌ HEAT Admin — Avtomatik report xətası\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nPlanlaşdırılan vaxt: ${dueTime} (${values.timezone})\nXəta: ${error instanceof Error ? error.message.slice(0, 180) : "Telegram reportu göndərilmədi."}`,
      });
    }
  }

  return Response.json({ ok: true, sent, adminDigestsSent }, { headers: { "cache-control": "no-store" } });
}

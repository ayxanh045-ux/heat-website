import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminStatusDigestDeliveries, customers, customerSecrets, customerSystemHealth, telegramReportDeliveries } from "@/db/schema";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { callTelegram, demoTelegramOwnerSummary } from "@/lib/telegram";
import { getCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { dueScheduledTime, localDateAndTime, scheduledDeliveryKey } from "@/lib/telegram-scheduler";
import { getAdminUser } from "@/lib/admin-auth";
import { globalAgentIsAuthorized, requestIsSameOrigin } from "@/lib/provisioning";
import { notifyAdminBot } from "@/lib/admin-bot";
import { ADMIN_DIGEST_TIMES, buildAdminHealthDigest } from "@/lib/admin-health-digest";
import { getOrCreateDemoDailyAiAnalysis, loadAiAnalysisSettings } from "@/lib/ai-analysis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminRequest = requestIsSameOrigin(request) && Boolean(await getAdminUser());
  if (!adminRequest && !(await globalAgentIsAuthorized(request))) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  const db = getDb();
  const now = new Date();
  let sent = 0;
  let adminDigestsSent = 0;
  const aiSettings = await loadAiAnalysisSettings();

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
    const reportTimes = values.telegramReportTimes.split(",");
    const scheduledTimes = aiSettings.enabled && aiSettings.configured
      ? [...new Set([...reportTimes, aiSettings.reportTime])]
      : reportTimes;
    const dueTime = dueScheduledTime(local.time, scheduledTimes);
    if (!dueTime) continue;

    const scheduledFor = `${local.date}T${dueTime}`;
    const id = scheduledDeliveryKey(vault.customerId, local.date, dueTime);
    const claimed = await db.insert(telegramReportDeliveries).values({ id, customerId: vault.customerId, scheduledFor }).onConflictDoNothing().returning({ id: telegramReportDeliveries.id });
    if (claimed.length === 0) continue;

    try {
      const energySettings = await getCustomerEnergySettings(vault.customerId);
      let reportText = demoTelegramOwnerSummary(values, energySettings);
      let aiIncluded = false;
      if (aiSettings.enabled && aiSettings.configured && dueTime === aiSettings.reportTime) {
        const analysis = await getOrCreateDemoDailyAiAnalysis(now);
        if (analysis.text) {
          const available = Math.max(0, 3900 - reportText.length - 2);
          reportText += `\n\n${analysis.text.slice(0, available)}`;
          aiIncluded = true;
          if (analysis.generated) {
            await notifyAdminBot({
              customerId: vault.customerId,
              eventType: "customer_ai_analysis_generated",
              message: `🤖 HEAT Admin — Gündəlik AI analizi hazırlandı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nModel: ${aiSettings.model}\nNəticə: Analiz müştərinin gündəlik Telegram reportuna əlavə edildi.`,
            });
          }
        } else if (analysis.generated && analysis.error) {
          await notifyAdminBot({
            customerId: vault.customerId,
            eventType: "customer_ai_analysis_failed",
            message: `⚠️ HEAT Admin — AI analiz xətası\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nModel: ${aiSettings.model}\nXəta: ${analysis.error}\nNəticə: Əsas enerji reportu AI bölməsi olmadan göndəriləcək.`,
          });
        }
      }
      await callTelegram(values.telegramBotToken, "sendMessage", {
        chat_id: values.telegramDefaultChatId,
        text: reportText,
      });
      sent += 1;
      await notifyAdminBot({
        customerId: vault.customerId,
        eventType: "customer_report_delivered",
        message: `✅ HEAT Admin — Avtomatik report göndərildi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nPlanlaşdırılan vaxt: ${dueTime} (${values.timezone})\nAI analizi: ${aiIncluded ? "reporta əlavə edildi" : "əlavə edilmədi"}\nNəticə: Müştəri Telegram reportunu qəbul etdi.`,
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

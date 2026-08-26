import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminStatusDigestDeliveries, customers, customerSecrets, customerSystemHealth, telegramReportDeliveries } from "@/db/schema";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { callTelegram, composeDailyTelegramMessage, demoTelegramOwnerSummary } from "@/lib/telegram";
import { getCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { dueScheduledTime, localDateAndTime, scheduledDeliveryKey } from "@/lib/telegram-scheduler";
import { getAdminUser } from "@/lib/admin-auth";
import { globalAgentIsAuthorized, requestIsSameOrigin } from "@/lib/provisioning";
import { notifyAdminBot } from "@/lib/admin-bot";
import { ADMIN_DIGEST_TIMES, buildAdminHealthDigest } from "@/lib/admin-health-digest";
import { getOrCreateCustomerDailyAiAnalysis, loadAiAnalysisSettings } from "@/lib/ai-analysis";

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

  const vaults = await db.select().from(customerSecrets);
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
      const reportText = demoTelegramOwnerSummary(values, energySettings);
      let aiIncluded = false;
      let customerMessage = composeDailyTelegramMessage(reportText);
      if (aiSettings.enabled && aiSettings.configured) {
        try {
          const analysis = await getOrCreateCustomerDailyAiAnalysis(vault.customerId, values, now);
          if (!analysis.text) throw new Error(analysis.error || "AI analizi yaradılmadı.");
          customerMessage = composeDailyTelegramMessage(reportText, analysis.text);
          aiIncluded = true;
          await notifyAdminBot({
            customerId: vault.customerId,
            eventType: "customer_ai_analysis_generated",
            message: `🤖 HEAT Admin — Gündəlik AI analizi hazırlandı\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nModel: ${aiSettings.model}\nNəticə: Qısa report və AI izahı eyni mesajda hazırlandı.`,
          });
        } catch (analysisError) {
          await notifyAdminBot({
            customerId: vault.customerId,
            eventType: "customer_ai_analysis_failed",
            message: `⚠️ HEAT Admin — AI analiz xətası\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nModel: ${aiSettings.model}\nXəta: ${analysisError instanceof Error ? analysisError.message.slice(0, 180) : "AI analizi yaradılmadı."}\nNəticə: Əsas enerji reportu uğurla göndərildi.`,
          });
        }
      }
      await callTelegram(values.telegramBotToken, "sendMessage", {
        chat_id: values.telegramDefaultChatId,
        text: customerMessage,
      });
      sent += 1;
      await notifyAdminBot({
        customerId: vault.customerId,
        eventType: "customer_report_delivered",
        message: `✅ HEAT Admin — Avtomatik report göndərildi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nPlanlaşdırılan vaxt: ${dueTime} (${values.timezone})\nAI analizi: ${aiIncluded ? "reportla eyni mesajda göndərildi" : "göndərilmədi"}\nNəticə: Müştəri qısa və anlaşıqlı Telegram reportunu qəbul etdi.`,
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

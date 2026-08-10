import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets, telegramReportDeliveries } from "@/db/schema";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { callTelegram, demoTelegramReply } from "@/lib/telegram";
import { dueScheduledTime, localDateAndTime, scheduledDeliveryKey } from "@/lib/telegram-scheduler";
import { getAdminUser } from "@/lib/admin-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request) || !await getAdminUser()) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  const db = getDb();
  const now = new Date();
  let sent = 0;

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
    } catch {
      await db.delete(telegramReportDeliveries).where(eq(telegramReportDeliveries.id, id));
    }
  }

  return Response.json({ ok: true, sent }, { headers: { "cache-control": "no-store" } });
}

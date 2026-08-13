import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets } from "@/db/schema";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { allowedTelegramChatIds, callTelegram, demoTelegramReply, safeEqual, telegramWebhookSecret } from "@/lib/telegram";
import { notifyAdminBot } from "@/lib/admin-bot";

type TelegramUpdate = {
  message?: { chat?: { id?: number | string }; text?: string };
};

export async function POST(request: Request, context: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await context.params;
    if (customerId !== DEMO_CUSTOMER.id) return Response.json({ ok: true });
    const [vault] = await getDb().select().from(customerSecrets).where(eq(customerSecrets.customerId, customerId)).limit(1);
    if (!vault) return Response.json({ ok: true });
    const values = await decryptProvisioningInput(vault.encryptedPayload);
    const botToken = values.telegramBotToken;
    if (!values.telegramEnabled || !botToken) return Response.json({ ok: true });
    const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (!await safeEqual(suppliedSecret, await telegramWebhookSecret(botToken))) {
      return Response.json({ ok: false }, { status: 403 });
    }
    const update = await request.json() as TelegramUpdate;
    const chatId = String(update.message?.chat?.id ?? "");
    const allowed = allowedTelegramChatIds(values);
    if (!chatId || !allowed.includes(chatId)) return Response.json({ ok: true });
    const rawText = update.message?.text?.trim() ?? "";
    if (!rawText.startsWith("/")) return Response.json({ ok: true });
    const parts = rawText.split(/\s+/);
    const command = parts[0].split("@", 1)[0].toLowerCase();
    const parameter = parts[1]?.trim();
    try {
      await callTelegram(botToken, "sendMessage", {
        chat_id: chatId,
        text: demoTelegramReply(command, values, { parameter }),
      });
      await notifyAdminBot({
        customerId,
        eventType: "customer_command_used",
        message: `📲 HEAT Admin — Müştəri Telegram komandası işlətdi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nNəticə: Cavab uğurla göndərildi.\nVaxt: ${new Date().toISOString()}`,
      });
    } catch (error) {
      await notifyAdminBot({
        customerId,
        eventType: "customer_command_failed",
        message: `❌ HEAT Admin — Müştəri Telegram komandasında xəta\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nXəta: ${error instanceof Error ? error.message.slice(0, 180) : "Cavab göndərilmədi."}\nVaxt: ${new Date().toISOString()}`,
      });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}

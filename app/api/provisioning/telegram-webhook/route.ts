import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { decryptProvisioningInput, requestIsSameOrigin } from "@/lib/provisioning";
import { allowedTelegramChatIds, callTelegram, TELEGRAM_COMMANDS, telegramWebhookSecret } from "@/lib/telegram";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const { customerId } = await request.json() as { customerId?: string };
    if (customerId !== DEMO_CUSTOMER.id) {
      return Response.json({ error: "Real müştərilərdə komandaları lokal HEAT xidməti idarə edir." }, { status: 400 });
    }
    const [vault] = await getDb().select().from(customerSecrets).where(eq(customerSecrets.customerId, customerId)).limit(1);
    if (!vault) return Response.json({ error: "Telegram məlumatları saxlanmayıb." }, { status: 404 });
    const values = await decryptProvisioningInput(vault.encryptedPayload);
    const botToken = values.telegramBotToken;
    const chatIds = allowedTelegramChatIds(values);
    if (!values.telegramEnabled || !botToken || chatIds.length === 0) {
      return Response.json({ error: "Telegram aktiv deyil və ya bot token/chat ID çatışmır." }, { status: 400 });
    }
    const webhookUrl = new URL(`/api/telegram/webhook/${encodeURIComponent(customerId)}`, request.url).toString();
    await callTelegram(botToken, "setWebhook", {
      url: webhookUrl,
      secret_token: await telegramWebhookSecret(botToken),
      allowed_updates: ["message"],
      drop_pending_updates: true,
    });
    await callTelegram(botToken, "deleteMyCommands", { scope: { type: "default" } });
    for (const chatId of chatIds) {
      await callTelegram(botToken, "setMyCommands", {
        commands: TELEGRAM_COMMANDS,
        scope: { type: "chat", chat_id: chatId },
      });
    }
    return Response.json({ ok: true, commands: TELEGRAM_COMMANDS.map(({ command }) => `/${command}`) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram komandaları aktiv edilmədi.";
    return Response.json({ error: message.slice(0, 180) }, { status: 400 });
  }
}

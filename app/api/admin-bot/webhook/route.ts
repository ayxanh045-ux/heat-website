import { ADMIN_BOT_HELP, loadAdminBot } from "@/lib/admin-bot";
import { buildDemoEnergyAnalysisPackage } from "@/lib/admin-energy-analysis";
import { callTelegram, safeEqual, telegramWebhookSecret } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
};

export async function POST(request: Request) {
  try {
    const config = await loadAdminBot();
    if (!config.enabled || !config.secret) {
      return Response.json({ error: "Admin Bot aktiv deyil." }, { status: 403 });
    }
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
    const expectedSecret = await telegramWebhookSecret(config.secret.botToken);
    if (!receivedSecret || !await safeEqual(receivedSecret, expectedSecret)) {
      return Response.json({ error: "Etibarsız webhook." }, { status: 403 });
    }

    const update = await request.json() as TelegramUpdate;
    const chatId = String(update.message?.chat?.id ?? "");
    if (chatId !== config.secret.chatId) {
      return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    }
    const rawText = String(update.message?.text ?? "").trim();
    const command = rawText.split(/\s+/, 1)[0].split("@", 1)[0].toLowerCase();
    const reply = command === "/demoanaliz"
      ? await buildDemoEnergyAnalysisPackage()
      : ADMIN_BOT_HELP;
    await callTelegram(config.secret.botToken, "sendMessage", {
      chat_id: config.secret.chatId,
      text: reply.slice(0, 3900),
    });
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Admin Bot cavabı göndərilmədi." }, { status: 400 });
  }
}

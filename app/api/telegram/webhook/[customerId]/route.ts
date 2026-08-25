import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets } from "@/db/schema";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { allowedTelegramChatIds, callTelegram, demoTelegramReply, safeEqual, telegramWebhookSecret } from "@/lib/telegram";
import { notifyAdminBot } from "@/lib/admin-bot";
import { getCustomerEnergySettings, parseBudgetAmount, parseWorkingHours, updateCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { generateCustomerAiAnalysis, getOrCreateCustomerDailyAiAnalysis } from "@/lib/ai-analysis";
import type { EnergyAnalysisPeriod } from "@/lib/admin-energy-analysis";

type TelegramUpdate = {
  message?: { chat?: { id?: number | string }; text?: string };
};

const AI_REPORT_COMMANDS: Partial<Record<string, EnergyAnalysisPeriod>> = {
  "/status": "status",
  "/report": "daily",
  "/last24h": "daily",
  "/weekly": "weekly",
  "/monthly": "monthly",
};

export async function POST(request: Request, context: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await context.params;
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
    const parts = rawText.split(/\s+/);
    const command = rawText.startsWith("/") ? parts[0].split("@", 1)[0].toLowerCase() : rawText;
    const parameter = parts[1]?.trim();
    try {
      let energySettings = await getCustomerEnergySettings(customerId);
      let reply: string;
      if (command === "/setbudget") {
        const monthlyBudgetAzn = parseBudgetAmount(parts[1] ?? "");
        energySettings = await updateCustomerEnergySettings(customerId, { monthlyBudgetAzn });
        reply = `✅ Aylıq büdcə yeniləndi\n\nYeni limit: ${energySettings.monthlyBudgetAzn.toFixed(2)} AZN\n\nBu dəyişiklik müştəri kabinetində və bütün büdcə hesablamalarında dərhal tətbiq olundu. /budget ilə vəziyyətə baxa bilərsiniz.`;
      } else if (command === "/sethours") {
        const hours = parseWorkingHours(parts[1] ?? "", parts[2] ?? "");
        energySettings = await updateCustomerEnergySettings(customerId, hours);
        reply = `✅ İş saatları yeniləndi\n\nYeni iş rejimi: ${energySettings.workingHoursStart}–${energySettings.workingHoursEnd}\n\nİş saatından sonrakı sərfiyyat bundan sonra bu rejimə əsasən hesablanacaq. /afterhours ilə baxa bilərsiniz.`;
      } else {
        reply = demoTelegramReply(command, values, { parameter, energySettings });
      }
      await callTelegram(botToken, "sendMessage", {
        chat_id: chatId,
        text: reply,
      });
      let aiResult = "Bu komanda üçün ayrıca AI analizi tələb olunmur.";
      const analysisPeriod = AI_REPORT_COMMANDS[command];
      if (analysisPeriod) {
        try {
          const analysis = analysisPeriod === "daily"
            ? await getOrCreateCustomerDailyAiAnalysis(customerId, values)
            : { text: await generateCustomerAiAnalysis(customerId, values, analysisPeriod), error: null };
          if (!analysis.text) throw new Error(analysis.error || "AI analizi hazırda əlçatan deyil.");
          await callTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: analysis.text,
          });
          aiResult = "Reportdan sonra ayrıca AI analizi göndərildi.";
          await notifyAdminBot({
            customerId,
            eventType: "customer_ai_analysis_delivered",
            message: `🤖 HEAT Admin — Müştəriyə AI analizi göndərildi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nDövr: ${analysisPeriod}\nNəticə: Report və AI analizi iki ayrı mesajla çatdırıldı.`,
          });
        } catch (analysisError) {
          const reason = analysisError instanceof Error ? analysisError.message.slice(0, 180) : "AI analizi yaradılmadı.";
          aiResult = `Əsas report göndərildi, AI analizi isə hazırlanmadı: ${reason}`;
          await callTelegram(botToken, "sendMessage", {
            chat_id: chatId,
            text: "🤖 AI ANALİZİ\n\nƏsas reportunuz hazırdır. Əlavə AI izahı hazırda yaradıla bilmədi. Bir qədər sonra eyni komandanı yenidən yoxlaya bilərsiniz.",
          }).catch(() => undefined);
          await notifyAdminBot({
            customerId,
            eventType: "customer_ai_analysis_failed",
            message: `⚠️ HEAT Admin — Müştəri AI analizi xətası\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nXəta: ${reason}\nNəticə: Əsas report uğurla göndərildi.`,
          });
        }
      }
      await notifyAdminBot({
        customerId,
        eventType: "customer_command_used",
        message: `📲 HEAT Admin — Müştəri Telegram komandası işlətdi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nNəticə: ${command === "/setbudget" || command === "/sethours" ? "Ayar yeniləndi." : "Cavab uğurla göndərildi."}\nAI: ${aiResult}\nVaxt: ${new Date().toISOString()}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Komanda icra edilmədi.";
      await callTelegram(botToken, "sendMessage", {
        chat_id: chatId,
        text: `❌ ${errorMessage}`,
      }).catch(() => undefined);
      await notifyAdminBot({
        customerId,
        eventType: "customer_command_failed",
        message: `❌ HEAT Admin — Müştəri Telegram komandasında xəta\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nXəta: ${errorMessage.slice(0, 180)}\nVaxt: ${new Date().toISOString()}`,
      });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}

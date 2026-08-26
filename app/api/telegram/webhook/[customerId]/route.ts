import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets } from "@/db/schema";
import { decryptProvisioningInput } from "@/lib/provisioning";
import { allowedTelegramChatIds, callTelegram, composeDailyTelegramMessage, demoTelegramReply, safeEqual, telegramWebhookSecret } from "@/lib/telegram";
import { notifyAdminBot } from "@/lib/admin-bot";
import { getCustomerEnergySettings, parseBudgetAmount, parseWorkingHours, updateCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { generateCustomerAiAnalysis, getOrCreateCustomerDailyAiAnalysis } from "@/lib/ai-analysis";
import type { EnergyAnalysisPeriod } from "@/lib/admin-energy-analysis";

type TelegramUpdate = {
  message?: { message_id?: number; chat?: { id?: number | string }; text?: string };
};

const AI_REPORT_COMMANDS: Partial<Record<string, { period: EnergyAnalysisPeriod; detailed?: boolean }>> = {
  "/status": { period: "status" },
  "/report": { period: "daily" },
  "/last24h": { period: "daily" },
  "/weekly": { period: "weekly" },
  "/monthly": { period: "monthly" },
  "/detailanalysis": { period: "daily", detailed: true },
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
    if (command === "/clear") {
      const commandMessageId = update.message?.message_id;
      if (!Number.isInteger(commandMessageId) || !commandMessageId) {
        await callTelegram(botToken, "sendMessage", { chat_id: chatId, text: "❌ Mesajları silmək mümkün olmadı." });
        return Response.json({ ok: true });
      }
      const firstMessageId = Math.max(1, commandMessageId - 99);
      const messageIds = Array.from({ length: commandMessageId - firstMessageId + 1 }, (_, index) => firstMessageId + index);
      try {
        let deletedCount = messageIds.length;
        try {
          await callTelegram(botToken, "deleteMessages", { chat_id: chatId, message_ids: messageIds });
        } catch {
          deletedCount = 0;
          const newestFirst = [...messageIds].reverse();
          for (let index = 0; index < newestFirst.length; index += 10) {
            const batch = newestFirst.slice(index, index + 10);
            const results = await Promise.allSettled(batch.map((messageId) =>
              callTelegram(botToken, "deleteMessage", { chat_id: chatId, message_id: messageId })
            ));
            deletedCount += results.filter((result) => result.status === "fulfilled").length;
          }
          if (deletedCount === 0) throw new Error("Telegram silinə bilən yeni mesaj tapmadı.");
        }
        await notifyAdminBot({
          customerId,
          eventType: "customer_chat_cleared",
          message: `🧹 HEAT Admin — Telegram söhbəti təmizləndi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: /clear\nSilinən mesaj sayı: ${deletedCount}\nNəticə: Silinməsinə icazə verilən mesajlar təmizləndi, köhnə və qadağan olunan mesajlar ötürüldü.`,
        });
      } catch (clearError) {
        const reason = clearError instanceof Error ? clearError.message.slice(0, 180) : "Telegram mesajları silmədi.";
        await callTelegram(botToken, "sendMessage", { chat_id: chatId, text: `❌ Mesajları silmək mümkün olmadı. ${reason}` }).catch(() => undefined);
        await notifyAdminBot({
          customerId,
          eventType: "customer_chat_clear_failed",
          message: `⚠️ HEAT Admin — Telegram söhbəti təmizlənmədi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nXəta: ${reason}`,
        });
      }
      return Response.json({ ok: true });
    }
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
      } else if (command === "/detailreport") {
        reply = demoTelegramReply("/report", values, { parameter, energySettings });
      } else if (command === "/detailanalysis") {
        reply = "📊 REPORT — ƏTRAFLI AI SORĞUSU\n\nDövr: Son 24 saat";
      } else {
        reply = demoTelegramReply(command, values, { parameter, energySettings });
      }
      let outgoingMessage = reply;
      let aiResult = "Bu komanda üçün ayrıca AI analizi tələb olunmur.";
      const analysisRequest = AI_REPORT_COMMANDS[command];
      if (analysisRequest) {
        try {
          const analysis = analysisRequest.detailed
            ? { text: await generateCustomerAiAnalysis(customerId, values, analysisRequest.period, "detailed"), error: null }
            : analysisRequest.period === "daily"
            ? await getOrCreateCustomerDailyAiAnalysis(customerId, values)
            : { text: await generateCustomerAiAnalysis(customerId, values, analysisRequest.period, "compact"), error: null };
          if (!analysis.text) throw new Error(analysis.error || "AI analizi hazırda əlçatan deyil.");
          outgoingMessage = composeDailyTelegramMessage(reply, analysis.text);
          aiResult = "Report və AI analizi eyni mesajda göndərildi.";
          await notifyAdminBot({
            customerId,
            eventType: "customer_ai_analysis_delivered",
            message: `🤖 HEAT Admin — Müştəriyə AI analizi göndərildi\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nDövr: ${analysisRequest.period}\nNəticə: REPORT və AI ANALİZİ eyni mesajda çatdırıldı.`,
          });
        } catch (analysisError) {
          const reason = analysisError instanceof Error ? analysisError.message.slice(0, 180) : "AI analizi yaradılmadı.";
          aiResult = `Report göndərildi, AI analizi isə hazırlanmadı: ${reason}`;
          outgoingMessage = composeDailyTelegramMessage(reply, "🤖 AI ANALİZİ\n\nAI izahı hazırda yaradıla bilmədi. Bir qədər sonra eyni komandanı yenidən yoxlaya bilərsiniz.");
          await notifyAdminBot({
            customerId,
            eventType: "customer_ai_analysis_failed",
            message: `⚠️ HEAT Admin — Müştəri AI analizi xətası\n\nMüştəri: ${values.customerName}\nObyekt: ${values.siteName}\nKomanda: ${command}\nXəta: ${reason}\nNəticə: Əsas report uğurla göndərildi.`,
          });
        }
      }
      await callTelegram(botToken, "sendMessage", { chat_id: chatId, text: outgoingMessage });
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

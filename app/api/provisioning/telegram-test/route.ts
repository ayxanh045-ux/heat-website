import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { decryptProvisioningInput, requestIsSameOrigin } from "@/lib/provisioning";
import { demoTelegramAlert, demoTelegramReply } from "@/lib/telegram";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const { customerId, scenario = "report" } = await request.json() as { customerId?: string; scenario?: "report" | "peak" | "anomaly" };
    if (!customerId) return Response.json({ error: "Müştəri seçilməyib." }, { status: 400 });
    const [vault] = await getDb().select().from(customerSecrets).where(eq(customerSecrets.customerId, customerId)).limit(1);
    if (!vault) return Response.json({ error: "Telegram məlumatları saxlanmayıb." }, { status: 404 });
    const values = await decryptProvisioningInput(vault.encryptedPayload);
    if (!values.telegramEnabled || !values.telegramBotToken || !values.telegramDefaultChatId) {
      return Response.json({ error: "Telegram aktiv deyil və ya bot token/chat ID çatışmır." }, { status: 400 });
    }
    const text = customerId === DEMO_CUSTOMER.id
      ? scenario === "peak" || scenario === "anomaly"
        ? demoTelegramAlert(scenario, values)
        : demoTelegramReply("/report", values, { automatic: true })
      : `✅ HEAT test bildirişi\n\n${values.customerName}\n${values.siteName}\n\nTelegram bağlantısı uğurla işləyir.`;
    const telegram = await fetch(`https://api.telegram.org/bot${values.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: values.telegramDefaultChatId,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await telegram.json() as { ok?: boolean; description?: string };
    if (!telegram.ok || !result.ok) throw new Error(result.description || "Telegram mesajı qəbul etmədi.");
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test bildirişi göndərilmədi.";
    return Response.json({ error: message.slice(0, 180) }, { status: 400 });
  }
}

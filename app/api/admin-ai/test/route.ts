import { getAdminUser } from "@/lib/admin-auth";
import { generateDemoAiAnalysis } from "@/lib/ai-analysis";
import { notifyAdminBot } from "@/lib/admin-bot";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";
import { requestIsSameOrigin } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await getAdminUser()) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  }
  try {
    const analysis = await generateDemoAiAnalysis();
    const delivery = await notifyAdminBot({
      customerId: DEMO_CUSTOMER.id,
      eventType: "ai_analysis_test",
      message: `🧪 HEAT Admin — AI analiz testi\n\nMüştəri: ${DEMO_CUSTOMER.customerName}\nNəticə: Gemini analizi uğurla yaradıldı.\n\n${analysis}`,
    });
    if (!delivery.delivered) throw new Error(delivery.reason || "Admin Bot aktiv deyil.");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message.slice(0, 180) : "AI analiz testi göndərilmədi.",
    }, { status: 400 });
  }
}

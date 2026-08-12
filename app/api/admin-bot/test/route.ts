import { getAdminUser } from "@/lib/admin-auth";
import { notifyAdminBot } from "@/lib/admin-bot";
import { requestIsSameOrigin } from "@/lib/provisioning";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  const now = new Date().toISOString();
  const result = await notifyAdminBot({
    eventType: "system_problem_test",
    customerId: "demo-caspian-coffee",
    message: `🧪 TEST XƏBƏRDARLIĞI — real nasazlıq deyil\n\n🚨 HEAT Admin — Müştəri sistemində problem\n\nMüştəri: Caspian Coffee · DEMO\nObyekt: Nizami filialı\nStatus: unhealthy\nSəbəb: Dashboard cavab vermir (test ssenarisi)\n\nXidmətlər:\n• dashboard: connection timeout\n• collector: healthy\n• influxdb: healthy\n• telegram: healthy\n\nVaxt: ${now}`,
  });
  if (!result.delivered) return Response.json({ error: result.reason || "Test mesajı göndərilmədi." }, { status: 400 });
  return Response.json({ ok: true });
}

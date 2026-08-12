import { getAdminUser } from "@/lib/admin-auth";
import { notifyAdminBot } from "@/lib/admin-bot";
import { requestIsSameOrigin } from "@/lib/provisioning";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  const result = await notifyAdminBot({
    eventType: "admin_bot_test",
    message: "✅ HEAT Admin Bot aktivdir\n\nMərkəzi monitorinq bağlantısı uğurla yoxlanıldı. Müştəri sistemlərində problem və report nəticələri bu bota göndəriləcək.",
  });
  if (!result.delivered) return Response.json({ error: result.reason || "Test mesajı göndərilmədi." }, { status: 400 });
  return Response.json({ ok: true });
}

import { getAdminUser } from "@/lib/admin-auth";
import { configureAdminBotWebhook, loadAdminBot } from "@/lib/admin-bot";
import { globalAgentIsAuthorized, requestIsSameOrigin } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminRequest = requestIsSameOrigin(request) && Boolean(await getAdminUser());
  if (!adminRequest && !(await globalAgentIsAuthorized(request))) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  try {
    const config = await loadAdminBot();
    if (!config.enabled || !config.secret) {
      return Response.json({ error: "Admin Bot aktiv deyil." }, { status: 400 });
    }
    await configureAdminBotWebhook(
      config.secret,
      new URL("/api/admin-bot/webhook", request.url).toString(),
    );
    return Response.json({ ok: true, command: "/demoanaliz" });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message.slice(0, 180) : "Admin Bot komandası aktiv edilmədi.",
    }, { status: 400 });
  }
}

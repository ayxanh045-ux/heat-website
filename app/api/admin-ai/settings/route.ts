import { getAdminUser } from "@/lib/admin-auth";
import {
  loadAiAnalysisSettings,
  saveAiAnalysisSettings,
  validateAiSettingsInput,
} from "@/lib/ai-analysis";
import { requestIsSameOrigin } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await getAdminUser()) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  const settings = await loadAiAnalysisSettings();
  return Response.json({
    enabled: settings.enabled,
    weeklyEnabled: settings.weeklyEnabled,
    monthlyEnabled: settings.monthlyEnabled,
    reportTime: settings.reportTime,
    model: settings.model,
    configured: settings.configured,
  }, { headers: { "cache-control": "no-store, private" } });
}

export async function PUT(request: Request) {
  if (!await getAdminUser()) {
    return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  }
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  }
  try {
    const values = validateAiSettingsInput(await request.json());
    const settings = await saveAiAnalysisSettings(values);
    return Response.json({ ok: true, ...settings });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message.slice(0, 180) : "AI analiz ayarları saxlanmadı.",
    }, { status: 400 });
  }
}

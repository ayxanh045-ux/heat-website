import { getDb } from "@/db";
import { energyAssessmentRequests } from "@/db/schema";
import { notifyAdminBot } from "@/lib/admin-bot";
import { requestIsSameOrigin } from "@/lib/provisioning";
import { checkRateLimit, getClientFingerprint, recordRateLimitHit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ASSESSMENT_RATE_CONFIG = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
};

function clean(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403, headers: { "cache-control": "no-store, private" } });
  }

  const fingerprint = await getClientFingerprint(request, "lead");
  const rateLimitStatus = await checkRateLimit({ key: fingerprint, ...ASSESSMENT_RATE_CONFIG });
  if (!rateLimitStatus.allowed) {
    const retryAfter = rateLimitStatus.retryAfterSeconds ?? 600;
    return Response.json(
      { error: "Çox sayda müraciət göndərildi. Zəhmət olmasa bir qədər sonra yenidən cəhd edin." },
      { status: 429, headers: { "retry-after": String(retryAfter), "cache-control": "no-store, private" } },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (clean(body.website, 200)) {
      // Honeypot triggered by bot
      return Response.json({ ok: true }, { headers: { "cache-control": "no-store, private" } });
    }

    const fullName = clean(body.name, 100);
    const companyName = clean(body.company, 120);
    const businessType = clean(body.businessType, 80);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160).toLowerCase();
    const monthlyElectricityCost = clean(body.cost, 80);
    const message = clean(body.message, 2000);
    const language = ["az", "en", "ru"].includes(clean(body.language, 2))
      ? clean(body.language, 2)
      : "az";
    const parsedLocations = Number.parseInt(clean(body.locations, 5), 10);
    const locationCount = Number.isInteger(parsedLocations) && parsedLocations > 0 && parsedLocations <= 10000
      ? parsedLocations
      : null;

    if (!fullName || !companyName || !businessType || !phone || !email) {
      return Response.json({ error: "Tələb olunan xanaları doldurun." }, { status: 400, headers: { "cache-control": "no-store, private" } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "E-poçt ünvanı düzgün deyil." }, { status: 400, headers: { "cache-control": "no-store, private" } });
    }

    await recordRateLimitHit({ key: fingerprint, ...ASSESSMENT_RATE_CONFIG });

    const id = crypto.randomUUID();
    try {
      await getDb().insert(energyAssessmentRequests).values({
        id,
        fullName,
        companyName,
        businessType,
        phone,
        email,
        locationCount,
        monthlyElectricityCost: monthlyElectricityCost || null,
        message: message || null,
        language,
      });
    } catch (dbErr) {
      console.warn("DB insert skipped or unavailable:", dbErr);
    }

    console.log("⚡ Yeni enerji qiymətləndirməsi sorğusu:", {
      id,
      fullName,
      companyName,
      businessType,
      phone,
      email,
      locationCount,
      monthlyElectricityCost,
      message,
    });

    const notification = [
      "⚡ Yeni enerji qiymətləndirməsi sorğusu",
      `Ad: ${fullName}`,
      `Şirkət: ${companyName}`,
      `Fəaliyyət: ${businessType}`,
      `Telefon: ${phone}`,
      `E-poçt: ${email}`,
      `Obyekt sayı: ${locationCount ?? "göstərilməyib"}`,
      `Aylıq xərc: ${monthlyElectricityCost || "göstərilməyib"}`,
      ...(message ? [`Mesaj: ${message}`] : []),
      `Sorğu ID: ${id}`,
    ].join("\n");

    try {
      await notifyAdminBot({ eventType: "energy_assessment_requested", message: notification });
    } catch {
      // The request remains safely stored even if the optional Telegram notification fails.
    }

    return Response.json({ ok: true, requestId: id }, { status: 201, headers: { "cache-control": "no-store, private" } });
  } catch {
    return Response.json({ error: "Sorğu saxlanmadı." }, { status: 500, headers: { "cache-control": "no-store, private" } });
  }
}

import { getDb } from "@/db";
import { energyAssessmentRequests } from "@/db/schema";
import { notifyAdminBot } from "@/lib/admin-bot";
import { requestIsSameOrigin } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

function clean(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (clean(body.website, 200)) return Response.json({ ok: true });

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
      return Response.json({ error: "Tələb olunan xanaları doldurun." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "E-poçt ünvanı düzgün deyil." }, { status: 400 });
    }

    const id = crypto.randomUUID();
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

    return Response.json({ ok: true, requestId: id }, { status: 201 });
  } catch {
    return Response.json({ error: "Sorğu saxlanmadı." }, { status: 500 });
  }
}

import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerEnergySettings, saveCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { requestIsSameOrigin } from "@/lib/provisioning";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "cache-control": "no-store, private" } });
    }
    return Response.json(
      await getCustomerEnergySettings(session.customerId),
      { headers: { "cache-control": "no-store, private" } },
    );
  } catch {
    return Response.json(
      { error: "Parametrlər oxuna bilmədi." },
      { status: 500, headers: { "cache-control": "no-store, private" } },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "cache-control": "no-store, private" } });
  }
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403, headers: { "cache-control": "no-store, private" } });
  }
  try {
    const settings = await saveCustomerEnergySettings(session.customerId, await request.json());
    return Response.json({ ok: true, settings }, { headers: { "cache-control": "no-store, private" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Parametrlər saxlanmadı." },
      { status: 400, headers: { "cache-control": "no-store, private" } },
    );
  }
}

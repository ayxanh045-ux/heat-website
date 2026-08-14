import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerEnergySettings, saveCustomerEnergySettings } from "@/lib/customer-energy-settings";
import { requestIsSameOrigin } from "@/lib/provisioning";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getCustomerEnergySettings(session.customerId));
}

export async function PUT(request: Request) {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const settings = await saveCustomerEnergySettings(session.customerId, await request.json());
    return Response.json({ ok: true, settings });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Parametrlər saxlanmadı." }, { status: 400 });
  }
}

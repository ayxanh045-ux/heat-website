import { getDb } from "@/db";
import { customers, provisioningJobs } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import {
  encryptProvisioningInput,
  requestIsSameOrigin,
  validateProvisioningInput,
} from "@/lib/provisioning";

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Müştəri yaradıla bilmədi.";
  if (message.includes("UNIQUE constraint failed")) return "Bu slug və ya Device ID artıq istifadə olunur.";
  if (message.includes("no such table")) return "Portal bazası hələ hazırlanmayıb.";
  return message.includes("token") || message.includes("key") ? "Təhlükəsizlik konfiqurasiyası tamamlanmayıb." : message;
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const input = validateProvisioningInput(await request.json());
    const encryptedPayload = await encryptProvisioningInput(input);
    const customerId = crypto.randomUUID();
    const jobId = crypto.randomUUID();
    const db = getDb();
    await db.batch([
      db.insert(customers).values({
        id: customerId,
        slug: input.customerSlug,
        customerName: input.customerName,
        siteName: input.siteName,
        deviceName: input.deviceName,
        deviceId: input.deviceId,
        collectorMode: input.collectorMode,
        ownerUserId: admin.userId,
        ownerEmail: admin.email,
      }),
      db.insert(provisioningJobs).values({ id: jobId, customerId, encryptedPayload }),
    ]);
    return Response.json({ customerId, jobId, status: "queued" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: safeError(error) }, { status: 400 });
  }
}

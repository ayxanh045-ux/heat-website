import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets, provisioningJobs } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { decryptProvisioningInput, requestIsSameOrigin } from "@/lib/provisioning";

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const customerId = typeof body.customerId === "string" ? body.customerId : "";
    if (!customerId) return Response.json({ error: "Müştəri seçilməyib." }, { status: 400 });

    const db = getDb();
    const [vault] = await db.select().from(customerSecrets).where(eq(customerSecrets.customerId, customerId)).limit(1);
    let encryptedPayload = vault?.encryptedPayload;

    // Existing customers created before the vault migration remain viewable.
    if (!encryptedPayload) {
      const [job] = await db.select().from(provisioningJobs).where(eq(provisioningJobs.customerId, customerId)).limit(1);
      encryptedPayload = job?.encryptedPayload;
    }
    if (!encryptedPayload) return Response.json({ error: "Bu müştəri üçün saxlanmış məlumat tapılmadı." }, { status: 404 });

    const secrets = await decryptProvisioningInput(encryptedPayload);
    if (vault) {
      const now = new Date().toISOString();
      await db.update(customerSecrets).set({
        viewCount: sql`${customerSecrets.viewCount} + 1`,
        lastViewedAt: now,
        updatedAt: now,
      }).where(eq(customerSecrets.customerId, customerId));
    }

    return Response.json({ secrets }, {
      headers: { "cache-control": "no-store, private", "pragma": "no-cache" },
    });
  } catch {
    return Response.json({ error: "Gizli məlumatlar açıla bilmədi." }, { status: 400 });
  }
}

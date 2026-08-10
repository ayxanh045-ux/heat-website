import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, customerSecrets, provisioningJobs } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { DEMO_CUSTOMER, DEMO_EDIT_VALUES } from "@/lib/demo-customer";
import { decryptProvisioningInput, encryptProvisioningInput, requestIsSameOrigin, validateProvisioningInput } from "@/lib/provisioning";

async function loadCustomer(customerId: string) {
  const db = getDb();
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  const [vault] = await db.select().from(customerSecrets).where(eq(customerSecrets.customerId, customerId)).limit(1);
  return { db, customer, vault };
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  try {
    const { id } = await context.params;
    const { customer, vault } = await loadCustomer(id);
    if (!customer) return Response.json({ error: "Müştəri məlumatları tapılmadı." }, { status: 404 });
    const values = vault ? await decryptProvisioningInput(vault.encryptedPayload) : id === DEMO_CUSTOMER.id ? DEMO_EDIT_VALUES : null;
    if (!values) return Response.json({ error: "Müştəri məlumatları tapılmadı." }, { status: 404 });
    return Response.json({ customerId: customer.id, values }, {
      headers: { "cache-control": "no-store, private", "pragma": "no-cache" },
    });
  } catch {
    return Response.json({ error: "Məlumatlar açıla bilmədi." }, { status: 400 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const { id } = await context.params;
    const { db, customer, vault } = await loadCustomer(id);
    if (!customer || (!vault && id !== DEMO_CUSTOMER.id)) return Response.json({ error: "Müştəri məlumatları tapılmadı." }, { status: 404 });
    const input = validateProvisioningInput(await request.json());
    if (input.customerSlug !== customer.slug) return Response.json({ error: "Müştəri slug sonradan dəyişdirilə bilməz." }, { status: 400 });
    const [running] = await db.select({ id: provisioningJobs.id }).from(provisioningJobs)
      .where(and(eq(provisioningJobs.customerId, id), inArray(provisioningJobs.status, ["pending", "running"]))).limit(1);
    if (running) return Response.json({ error: "Bu müştəri üçün başqa yenilənmə hazırda növbədədir." }, { status: 409 });
    const encryptedPayload = await encryptProvisioningInput(input);
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    if (id === DEMO_CUSTOMER.id) {
      await db.batch([
        db.update(customers).set({ customerName: input.customerName, siteName: input.siteName, deviceName: input.deviceName, deviceId: input.deviceId, collectorMode: input.collectorMode, updatedAt: now }).where(eq(customers.id, id)),
        db.insert(customerSecrets).values({ customerId: id, encryptedPayload }).onConflictDoUpdate({ target: customerSecrets.customerId, set: { encryptedPayload, updatedAt: now } }),
      ]);
      return Response.json({ ok: true, demo: true });
    }
    await db.batch([
      db.update(customers).set({
        customerName: input.customerName, siteName: input.siteName, deviceName: input.deviceName,
        deviceId: input.deviceId, collectorMode: input.collectorMode, status: "queued", updatedAt: now,
      }).where(eq(customers.id, id)),
      db.update(customerSecrets).set({ encryptedPayload, updatedAt: now }).where(eq(customerSecrets.customerId, id)),
      db.insert(provisioningJobs).values({ id: jobId, customerId: id, encryptedPayload }),
    ]);
    return Response.json({ ok: true, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Məlumatlar yenilənə bilmədi.";
    return Response.json({ error: message.includes("UNIQUE constraint") ? "Bu Device ID başqa müştəridə istifadə olunur." : message }, { status: 400 });
  }
}

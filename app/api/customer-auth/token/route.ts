import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerAccessTokens, customerSessions, customers } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { randomToken, sha256 } from "@/lib/customer-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const { customerId } = await request.json() as { customerId?: string };
    if (!customerId) return Response.json({ error: "Müştəri seçilməyib." }, { status: 400 });
    const [customer] = await getDb().select({ id: customers.id }).from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!customer) return Response.json({ error: "Müştəri tapılmadı." }, { status: 404 });
    const token = `HEAT-${randomToken(24)}`;
    const db = getDb();
    await db.batch([
      db.insert(customerAccessTokens).values({ customerId, tokenHash: await sha256(token) }).onConflictDoUpdate({
        target: customerAccessTokens.customerId, set: { tokenHash: await sha256(token), updatedAt: new Date().toISOString() },
      }),
      db.delete(customerSessions).where(eq(customerSessions.customerId, customerId)),
    ]);
    return Response.json({ token });
  } catch {
    return Response.json({ error: "Token yaradıla bilmədi." }, { status: 400 });
  }
}

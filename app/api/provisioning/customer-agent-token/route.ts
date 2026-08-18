import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerAgentTokens, customers } from "@/db/schema";
import { globalAgentIsAuthorized, hashAgentToken } from "@/lib/provisioning";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  if (!(await globalAgentIsAuthorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 50) : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!SLUG.test(slug) || token.length < 32 || token.length > 200) {
      return Response.json({ error: "Invalid scoped token" }, { status: 400 });
    }
    const db = getDb();
    const [customer] = await db.select({ id: customers.id }).from(customers)
      .where(eq(customers.slug, slug)).limit(1);
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    const now = new Date().toISOString();
    await db.insert(customerAgentTokens).values({
      customerId: customer.id,
      tokenHash: await hashAgentToken(token),
      updatedAt: now,
    }).onConflictDoUpdate({
      target: customerAgentTokens.customerId,
      set: { tokenHash: await hashAgentToken(token), updatedAt: now },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid scoped token" }, { status: 400 });
  }
}

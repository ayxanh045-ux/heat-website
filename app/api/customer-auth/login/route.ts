import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerAccessTokens, customerSessions } from "@/db/schema";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_DAYS, randomToken, sha256 } from "@/lib/customer-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  try {
    const { token } = await request.json() as { token?: string };
    if (!token || token.length < 20 || token.length > 100) throw new Error("INVALID");
    const [access] = await getDb().select({ customerId: customerAccessTokens.customerId }).from(customerAccessTokens)
      .where(eq(customerAccessTokens.tokenHash, await sha256(token.trim()))).limit(1);
    if (!access) throw new Error("INVALID");
    const sessionToken = randomToken(32);
    const expires = new Date(Date.now() + CUSTOMER_SESSION_DAYS * 86400000);
    await getDb().insert(customerSessions).values({ id: crypto.randomUUID(), customerId: access.customerId, sessionHash: await sha256(sessionToken), expiresAt: expires.toISOString() });
    return Response.json({ ok: true }, { headers: { "set-cookie": `${CUSTOMER_SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${CUSTOMER_SESSION_DAYS * 86400}` } });
  } catch {
    return Response.json({ error: "Token düzgün deyil və ya yenilənib." }, { status: 401 });
  }
}

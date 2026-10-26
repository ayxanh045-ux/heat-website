import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSessions } from "@/db/schema";
import { CUSTOMER_SESSION_COOKIE, pruneExpiredCustomerSessions, sha256 } from "@/lib/customer-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  const cookie = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${CUSTOMER_SESSION_COOKIE}=([^;]+)`))?.[1];
  if (cookie) await getDb().delete(customerSessions).where(eq(customerSessions.sessionHash, await sha256(cookie)));
  await pruneExpiredCustomerSessions();
  return Response.json({ ok: true }, { headers: { "set-cookie": `${CUSTOMER_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
}

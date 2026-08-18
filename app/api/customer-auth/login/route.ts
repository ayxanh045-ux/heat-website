import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerAccessTokens, customerLoginAttempts, customerSessions } from "@/db/schema";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_DAYS, randomToken, sha256 } from "@/lib/customer-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

async function requestFingerprint(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return sha256(ip);
}

async function isBlocked(fingerprint: string, now: Date): Promise<boolean> {
  const [attempt] = await getDb().select().from(customerLoginAttempts)
    .where(eq(customerLoginAttempts.fingerprint, fingerprint)).limit(1);
  return Boolean(attempt?.blockedUntil && attempt.blockedUntil > now.toISOString());
}

async function recordFailure(fingerprint: string, now: Date): Promise<void> {
  const db = getDb();
  const [attempt] = await db.select().from(customerLoginAttempts)
    .where(eq(customerLoginAttempts.fingerprint, fingerprint)).limit(1);
  const windowExpired = !attempt || new Date(attempt.windowStartedAt).getTime() <= now.getTime() - WINDOW_MS;
  const failureCount = windowExpired ? 1 : attempt.failureCount + 1;
  const blockedUntil = failureCount >= MAX_FAILURES ? new Date(now.getTime() + WINDOW_MS).toISOString() : null;
  await db.insert(customerLoginAttempts).values({
    fingerprint, failureCount, windowStartedAt: windowExpired ? now.toISOString() : attempt.windowStartedAt,
    blockedUntil, updatedAt: now.toISOString(),
  }).onConflictDoUpdate({ target: customerLoginAttempts.fingerprint, set: {
    failureCount, windowStartedAt: windowExpired ? now.toISOString() : attempt?.windowStartedAt ?? now.toISOString(),
    blockedUntil, updatedAt: now.toISOString(),
  } });
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  const now = new Date();
  const fingerprint = await requestFingerprint(request);
  if (await isBlocked(fingerprint, now)) {
    return Response.json({ error: "Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın." }, { status: 429, headers: { "retry-after": "900" } });
  }
  try {
    const { token } = await request.json() as { token?: string };
    if (!token || token.length < 20 || token.length > 100) throw new Error("INVALID");
    const [access] = await getDb().select({ customerId: customerAccessTokens.customerId }).from(customerAccessTokens)
      .where(eq(customerAccessTokens.tokenHash, await sha256(token.trim()))).limit(1);
    if (!access) throw new Error("INVALID");
    const sessionToken = randomToken(32);
    const expires = new Date(Date.now() + CUSTOMER_SESSION_DAYS * 86400000);
    await getDb().insert(customerSessions).values({ id: crypto.randomUUID(), customerId: access.customerId, sessionHash: await sha256(sessionToken), expiresAt: expires.toISOString() });
    await getDb().delete(customerLoginAttempts).where(eq(customerLoginAttempts.fingerprint, fingerprint));
    return Response.json({ ok: true }, { headers: { "set-cookie": `${CUSTOMER_SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${CUSTOMER_SESSION_DAYS * 86400}` } });
  } catch {
    await recordFailure(fingerprint, now);
    return Response.json({ error: "Token düzgün deyil və ya yenilənib." }, { status: 401 });
  }
}

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerAccessTokens, customerSessions } from "@/db/schema";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_DAYS, pruneExpiredCustomerSessions, randomToken, sha256 } from "@/lib/customer-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";
import { checkRateLimit, getClientFingerprint, recordRateLimitHit, resetRateLimit } from "@/lib/rate-limit";

const RATE_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) {
    return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  }

  const fingerprint = await getClientFingerprint(request, "login");
  const rateLimitKey = fingerprint;
  const rateLimitStatus = await checkRateLimit({ key: rateLimitKey, ...RATE_CONFIG });

  if (!rateLimitStatus.allowed) {
    const retryAfter = rateLimitStatus.retryAfterSeconds ?? 900;
    return Response.json(
      { error: "Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın." },
      { status: 429, headers: { "retry-after": String(retryAfter), "cache-control": "no-store, private" } },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token || token.length < 20 || token.length > 100) {
      throw new Error("INVALID");
    }

    const [access] = await getDb().select({ customerId: customerAccessTokens.customerId }).from(customerAccessTokens)
      .where(eq(customerAccessTokens.tokenHash, await sha256(token))).limit(1);

    if (!access) {
      throw new Error("INVALID");
    }

    const sessionToken = randomToken(32);
    const expires = new Date(Date.now() + CUSTOMER_SESSION_DAYS * 86400000);
    await getDb().insert(customerSessions).values({
      id: crypto.randomUUID(),
      customerId: access.customerId,
      sessionHash: await sha256(sessionToken),
      expiresAt: expires.toISOString(),
    });

    await pruneExpiredCustomerSessions();
    await resetRateLimit(rateLimitKey);

    return Response.json(
      { ok: true },
      {
        headers: {
          "set-cookie": `${CUSTOMER_SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${CUSTOMER_SESSION_DAYS * 86400}`,
          "cache-control": "no-store, private",
        },
      },
    );
  } catch {
    await recordRateLimitHit({ key: rateLimitKey, ...RATE_CONFIG });
    return Response.json(
      { error: "Token düzgün deyil və ya yenilənib." },
      { status: 401, headers: { "cache-control": "no-store, private" } },
    );
  }
}

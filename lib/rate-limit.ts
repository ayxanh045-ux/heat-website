import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerLoginAttempts } from "@/db/schema";

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getClientFingerprint(request: Request, prefix = "req"): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "";
  const ua = request.headers.get("user-agent") ?? "";
  const acceptLang = request.headers.get("accept-language") ?? "";
  const raw = ip ? `ip:${ip}` : `ua:${ua}:lang:${acceptLang}`;
  const hash = await sha256Hex(raw);
  return `${prefix}:${hash}`;
}

export type RateLimitConfig = {
  key: string;
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
};

export async function checkRateLimit(config: RateLimitConfig): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const db = getDb();
    const [record] = await db.select().from(customerLoginAttempts)
      .where(eq(customerLoginAttempts.fingerprint, config.key))
      .limit(1);

    if (!record) return { allowed: true };

    const now = Date.now();
    if (record.blockedUntil) {
      const blockedUntilMs = new Date(record.blockedUntil).getTime();
      if (blockedUntilMs > now) {
        const retryAfterSeconds = Math.ceil((blockedUntilMs - now) / 1000);
        return { allowed: false, retryAfterSeconds };
      }
    }

    const windowStartMs = new Date(record.windowStartedAt).getTime();
    if (now - windowStartMs <= config.windowMs && record.failureCount >= config.maxAttempts) {
      const blockMs = config.blockDurationMs ?? config.windowMs;
      const retryAfterSeconds = Math.ceil((windowStartMs + blockMs - now) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }

    return { allowed: true };
  } catch {
    // If DB is temporarily degraded, fail open to avoid total service outage
    return { allowed: true };
  }
}

export async function recordRateLimitHit(config: RateLimitConfig): Promise<void> {
  try {
    const db = getDb();
    const now = new Date();
    const nowMs = now.getTime();
    const [record] = await db.select().from(customerLoginAttempts)
      .where(eq(customerLoginAttempts.fingerprint, config.key))
      .limit(1);

    const windowExpired = !record || nowMs - new Date(record.windowStartedAt).getTime() > config.windowMs;
    const failureCount = windowExpired ? 1 : record.failureCount + 1;
    const blockMs = config.blockDurationMs ?? config.windowMs;
    const blockedUntil = failureCount >= config.maxAttempts
      ? new Date(nowMs + blockMs).toISOString()
      : null;

    const windowStartedAt = windowExpired ? now.toISOString() : record.windowStartedAt;
    const updatedAt = now.toISOString();

    await db.insert(customerLoginAttempts).values({
      fingerprint: config.key,
      failureCount,
      windowStartedAt,
      blockedUntil,
      updatedAt,
    }).onConflictDoUpdate({
      target: customerLoginAttempts.fingerprint,
      set: {
        failureCount,
        windowStartedAt,
        blockedUntil,
        updatedAt,
      },
    });
  } catch {
    // Ignore rate-limit recording failure gracefully
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    const db = getDb();
    await db.delete(customerLoginAttempts).where(eq(customerLoginAttempts.fingerprint, key));
  } catch {
    // Ignore cleanup errors
  }
}

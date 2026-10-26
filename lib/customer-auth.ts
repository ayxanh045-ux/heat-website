import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { customers, customerSessions } from "@/db/schema";

export const CUSTOMER_SESSION_COOKIE = "heat_customer_session";
export const CUSTOMER_SESSION_DAYS = 30;

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(byteLength = 24): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function pruneExpiredCustomerSessions(): Promise<void> {
  try {
    const now = new Date().toISOString();
    await getDb().delete(customerSessions).where(lt(customerSessions.expiresAt, now));
  } catch {
    // Gracefully handle uninitialized database in mock/test contexts
  }
}

export async function getCustomerSession() {
  const sessionToken = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;
  const sessionHash = await sha256(sessionToken);
  const [result] = await getDb().select({
    sessionId: customerSessions.id, customerId: customers.id, customerName: customers.customerName,
    siteName: customers.siteName, deviceName: customers.deviceName, deviceId: customers.deviceId,
    status: customers.status, grafanaPort: customers.grafanaPort,
  }).from(customerSessions).innerJoin(customers, eq(customerSessions.customerId, customers.id))
    .where(and(eq(customerSessions.sessionHash, sessionHash), gt(customerSessions.expiresAt, new Date().toISOString()))).limit(1);
  return result ?? null;
}

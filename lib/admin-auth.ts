import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { adminDevices } from "@/db/schema";
import { sha256 } from "@/lib/customer-auth";

export const ADMIN_DEVICE_COOKIE = "heat_admin_device";
export const ADMIN_DEVICE_MAX_AGE = 365 * 24 * 60 * 60;

function configuredAdminEmails(): Set<string> {
  const value = (env as unknown as Record<string, unknown>).ADMIN_EMAILS;
  return new Set(String(value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function isAdmin(user: ChatGPTUser): boolean {
  return configuredAdminEmails().has(user.email.toLowerCase());
}

export async function isApprovedAdminDevice(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_DEVICE_COOKIE)?.value;
  if (!token || token.length < 32 || token.length > 200) return false;
  const [device] = await getDb().select({ id: adminDevices.id }).from(adminDevices)
    .where(eq(adminDevices.tokenHash, await sha256(token))).limit(1);
  return Boolean(device);
}

export async function getAllowlistedAdminUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return user && isAdmin(user) ? user : null;
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  const user = await getAllowlistedAdminUser();
  return user && await isApprovedAdminDevice() ? user : null;
}

export async function requireAdminUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (!isAdmin(user)) redirect("/");
  if (!await isApprovedAdminDevice()) redirect(`/admin/device-setup?return_to=${encodeURIComponent(returnTo)}`);
  return user;
}

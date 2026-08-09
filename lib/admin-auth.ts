import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";

function configuredAdminEmails(): Set<string> {
  const value = (env as unknown as Record<string, unknown>).ADMIN_EMAILS;
  return new Set(String(value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function isAdmin(user: ChatGPTUser): boolean {
  return configuredAdminEmails().has(user.email.toLowerCase());
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return user && isAdmin(user) ? user : null;
}

export async function requireAdminUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (!isAdmin(user)) throw new Error("ADMIN_FORBIDDEN");
  return user;
}

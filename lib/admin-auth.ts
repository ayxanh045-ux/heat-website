import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getAdminAccessToken, getAdminEmails } from "@/lib/env";

export function isAdmin(user: ChatGPTUser): boolean {
  return getAdminEmails().has(user.email.toLowerCase());
}

export async function getAllowlistedAdminUser(): Promise<ChatGPTUser | null> {
  const token = getAdminAccessToken();
  if (token) {
    const requestHeaders = await headers();
    const bearer = requestHeaders.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const adminHeader = requestHeaders.get("x-admin-token")?.trim();
    if ((bearer && bearer === token) || (adminHeader && adminHeader === token)) {
      const fallbackEmail = Array.from(getAdminEmails())[0] || "admin@heatenergyanalytics.com";
      return {
        userId: "admin-access-token",
        displayName: "Administrator",
        email: fallbackEmail,
        fullName: "Administrator",
      };
    }
  }

  const user = await getChatGPTUser();
  return user && isAdmin(user) ? user : null;
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  return getAllowlistedAdminUser();
}

export async function requireAdminUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getAdminUser();
  if (user) return user;

  const chatGptUser = await requireChatGPTUser(returnTo);
  if (!isAdmin(chatGptUser)) redirect("/");
  return chatGptUser;
}

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getAdminAccessToken, getAdminEmails } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "heat_admin_session";
export const DEFAULT_ADMIN_KEY = "heat2026";

export function isAdmin(user: ChatGPTUser): boolean {
  return getAdminEmails().has(user.email.toLowerCase());
}

export async function getAllowlistedAdminUser(): Promise<ChatGPTUser | null> {
  const token = getAdminAccessToken();
  try {
    const requestHeaders = await headers();
    const bearer = requestHeaders.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const adminHeader = requestHeaders.get("x-admin-token")?.trim();
    if (token && ((bearer && bearer === token) || (adminHeader && adminHeader === token))) {
      const fallbackEmail = Array.from(getAdminEmails())[0] || "admin@heatenergyanalytics.com";
      return {
        userId: "admin-access-token",
        displayName: "Administrator",
        email: fallbackEmail,
        fullName: "Administrator",
      };
    }
  } catch {
    // headers unavailable in static contexts
  }

  // Cookie or default session check for Vercel deployment
  try {
    const cookieStore = await cookies();
    const cookieSession = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (cookieSession && (cookieSession === DEFAULT_ADMIN_KEY || (token && cookieSession === token))) {
      return {
        userId: "admin-session-user",
        displayName: "Administrator",
        email: "admin@heatenergyanalytics.com",
        fullName: "Administrator",
      };
    }
  } catch {
    // cookies unavailable
  }

  try {
    const user = await getChatGPTUser();
    return user && isAdmin(user) ? user : null;
  } catch {
    return null;
  }
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  return getAllowlistedAdminUser();
}

export async function requireAdminUser(returnTo: string): Promise<ChatGPTUser | null> {
  const user = await getAdminUser();
  if (user) return user;

  try {
    const chatGptUser = await requireChatGPTUser(returnTo);
    if (!isAdmin(chatGptUser)) redirect("/");
    return chatGptUser;
  } catch {
    return null;
  }
}

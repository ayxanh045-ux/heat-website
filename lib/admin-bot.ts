import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { adminBotEvents, adminBotSettings } from "@/db/schema";
import { callTelegram } from "@/lib/telegram";

export const ADMIN_BOT_SETTINGS_ID = "heat-admin-bot";

export type AdminBotSecret = {
  botToken: string;
  chatId: string;
};

const BOT_TOKEN = /^\d{6,12}:[A-Za-z0-9_-]{30,}$/;
const CHAT_ID = /^-?\d{5,20}$/;

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const configured = (env as unknown as Record<string, unknown>).PROVISIONING_ENCRYPTION_KEY;
  const keyBytes = decodeBase64(String(configured ?? ""));
  if (keyBytes.byteLength !== 32) throw new Error("Admin Bot şifrələmə açarı hazır deyil.");
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, usage);
}

export function validateAdminBotSecret(raw: unknown): AdminBotSecret {
  if (!raw || typeof raw !== "object") throw new Error("Admin Bot məlumatları düzgün deyil.");
  const values = raw as Record<string, unknown>;
  const botToken = typeof values.botToken === "string" ? values.botToken.trim().slice(0, 500) : "";
  const chatId = typeof values.chatId === "string" ? values.chatId.trim().slice(0, 40) : "";
  if (!BOT_TOKEN.test(botToken)) throw new Error("BotFather tokeni düzgün formatda deyil.");
  if (!CHAT_ID.test(chatId)) throw new Error("Admin Telegram chat ID düzgün deyil.");
  return { botToken, chatId };
}

export async function encryptAdminBotSecret(secret: AdminBotSecret): Promise<string> {
  const key = await encryptionKey(["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(secret));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptAdminBotSecret(payload: string): Promise<AdminBotSecret> {
  const [version, encodedIv, encodedCiphertext] = payload.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) throw new Error("Admin Bot seyfi açıla bilmədi.");
  const key = await encryptionKey(["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(encodedIv) },
    key,
    decodeBase64(encodedCiphertext),
  );
  return validateAdminBotSecret(JSON.parse(new TextDecoder().decode(plaintext)));
}

export async function loadAdminBot(): Promise<{ enabled: boolean; secret: AdminBotSecret | null }> {
  const [row] = await getDb().select().from(adminBotSettings)
    .where(eq(adminBotSettings.id, ADMIN_BOT_SETTINGS_ID)).limit(1);
  if (!row) return { enabled: false, secret: null };
  try {
    return { enabled: row.enabled, secret: await decryptAdminBotSecret(row.encryptedPayload) };
  } catch {
    return { enabled: false, secret: null };
  }
}

export async function notifyAdminBot(input: {
  eventType: string;
  message: string;
  customerId?: string;
}): Promise<{ delivered: boolean; reason?: string }> {
  const db = getDb();
  const id = crypto.randomUUID();
  let delivered = false;
  let outcome = "skipped";
  let reason = "Admin Bot aktiv deyil.";
  try {
    const config = await loadAdminBot();
    if (config.enabled && config.secret) {
      await callTelegram(config.secret.botToken, "sendMessage", {
        chat_id: config.secret.chatId,
        text: input.message.slice(0, 3900),
      });
      delivered = true;
      outcome = "delivered";
      reason = "";
    }
  } catch (error) {
    outcome = "failed";
    reason = error instanceof Error ? error.message.slice(0, 180) : "Telegram bildirişi göndərilmədi.";
  }
  await db.insert(adminBotEvents).values({
    id,
    customerId: input.customerId,
    eventType: input.eventType,
    outcome,
    message: input.message.slice(0, 3900),
    deliveredAt: delivered ? new Date().toISOString() : null,
  });
  return { delivered, ...(reason ? { reason } : {}) };
}

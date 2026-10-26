import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getProvisioningEncryptionKey } from "@/lib/env";
import { adminBotEvents, adminBotSettings } from "@/db/schema";
import { callTelegram, telegramWebhookSecret } from "@/lib/telegram";

export const ADMIN_BOT_SETTINGS_ID = "heat-admin-bot";
export const ADMIN_BOT_COMMANDS = [
  { command: "start", description: "HEAT Admin Bot menyusunu aç" },
  { command: "demoanaliz", description: "Demo üçün günlük enerji analiz məlumatları" },
  { command: "help", description: "Admin komandalarını göstər" },
] as const;

export const ADMIN_BOT_HELP =
  "HEAT Admin Bot\n\n" +
  "/demoanaliz — Demo hesabının günlük enerji məlumatlarını Gemini Notebook üçün hazır paket kimi verir.\n" +
  "/help — bu komanda siyahısını göstərir.";

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
  const configured = getProvisioningEncryptionKey();
  const keyBytes = decodeBase64(configured);
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

export async function configureAdminBotWebhook(
  secret: AdminBotSecret,
  webhookUrl: string,
): Promise<void> {
  await callTelegram(secret.botToken, "setWebhook", {
    url: webhookUrl,
    secret_token: await telegramWebhookSecret(secret.botToken),
    allowed_updates: ["message"],
    drop_pending_updates: false,
  });
  await callTelegram(secret.botToken, "setMyCommands", {
    commands: ADMIN_BOT_COMMANDS,
    scope: { type: "default" },
  });
  await callTelegram(secret.botToken, "setMyCommands", {
    commands: ADMIN_BOT_COMMANDS,
    scope: { type: "chat", chat_id: secret.chatId },
  });
  await callTelegram(secret.botToken, "setChatMenuButton", {
    chat_id: secret.chatId,
    menu_button: { type: "commands" },
  });
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

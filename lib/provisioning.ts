import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getProvisioningEncryptionKey, getProvisionerAgentToken } from "@/lib/env";
import { customerAgentTokens, customers } from "@/db/schema";
import { ELECTRICITY_TARIFF_AZN_PER_KWH } from "@/lib/electricity";

export type ProvisioningInput = {
  customerName: string;
  customerSlug: string;
  siteName: string;
  deviceName: string;
  deviceId: string;
  deviceModel: string;
  timezone: string;
  collectorMode: "polling" | "hybrid";
  shellyServerUri: string;
  shellyCloudAuthKey: string;
  shellyOAuthAccessToken?: string;
  shellyUserApiUrl?: string;
  influxOrg: string;
  influxBucket: string;
  influxAdminUsername: string;
  influxAdminPassword: string;
  influxAdminToken: string;
  grafanaAdminUsername: string;
  grafanaAdminPassword: string;
  electricityTariffAznPerKwh: number;
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramAllowedChatIds?: string;
  telegramDefaultChatId?: string;
  telegramReportCount: number;
  telegramReportTimes: string;
  phaseALabel: string;
  phaseBLabel: string;
  phaseCLabel: string;
  businessType: string;
  workingHours: string;
  closedDays: string;
  majorEquipment: string;
  alwaysOnEquipment: string;
  energyGoals: string;
  siteContext: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEVICE_ID = /^[a-zA-Z0-9]+$/;
const CHAT_IDS = /^-?\d+(?:\s*,\s*-?\d+)*$/;
const REPORT_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class ProvisioningValidationError extends Error {}

function cleanString(value: unknown, maximum = 200): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function secureShellyUrl(value: string, field: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new ProvisioningValidationError(`${field} düzgün URL olmalıdır.`); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new ProvisioningValidationError(`${field} yalnız təhlükəsiz HTTPS ünvanı ola bilər.`);
  }
  if (url.search || url.hash) throw new ProvisioningValidationError(`${field} query və fragment daşımamalıdır.`);
  return url.toString().replace(/\/$/, "");
}

export function validateProvisioningInput(raw: unknown): ProvisioningInput {
  if (!raw || typeof raw !== "object") throw new ProvisioningValidationError("Form məlumatı düzgün deyil.");
  const input = raw as Record<string, unknown>;
  const customerName = cleanString(input.customerName, 100);
  const customerSlug = cleanString(input.customerSlug, 50).toLowerCase();
  const siteName = cleanString(input.siteName, 100);
  const deviceName = cleanString(input.deviceName, 100);
  const deviceId = cleanString(input.deviceId, 80).toLowerCase().replace(/^0x/, "");
  const collectorMode = cleanString(input.collectorMode) as ProvisioningInput["collectorMode"];
  const influxAdminPassword = cleanString(input.influxAdminPassword, 300);
  const influxAdminToken = cleanString(input.influxAdminToken, 500);
  const grafanaAdminPassword = cleanString(input.grafanaAdminPassword, 300);
  const electricityTariffAznPerKwh = ELECTRICITY_TARIFF_AZN_PER_KWH;
  const telegramEnabled = input.telegramEnabled === true;
  const telegramAllowedChatIds = cleanString(input.telegramAllowedChatIds, 300);
  const telegramDefaultChatId = cleanString(input.telegramDefaultChatId, 50);
  const reportCount = Number(input.telegramReportCount ?? 1);
  const reportTimes = (cleanString(input.telegramReportTimes, 100) || "09:00").split(",").map((value) => value.trim()).filter(Boolean);
  if (!customerName || !siteName || !deviceName) throw new ProvisioningValidationError("Müştəri, obyekt və cihaz adı tələb olunur.");
  if (!SLUG.test(customerSlug)) throw new ProvisioningValidationError("Slug yalnız kiçik hərf, rəqəm və tire daşımalıdır.");
  if (!DEVICE_ID.test(deviceId)) throw new ProvisioningValidationError("Shelly Device ID düzgün formatda deyil.");
  if (!new Set(["polling", "hybrid"]).has(collectorMode)) throw new ProvisioningValidationError("Collector rejimi düzgün deyil.");
  if (influxAdminPassword.length < 12 || grafanaAdminPassword.length < 12) throw new ProvisioningValidationError("InfluxDB və Grafana parolları ən azı 12 simvol olmalıdır.");
  if (influxAdminToken.length < 16) throw new ProvisioningValidationError("InfluxDB init token ən azı 16 simvol olmalıdır.");
  if (telegramEnabled && (!telegramAllowedChatIds || !CHAT_IDS.test(telegramAllowedChatIds))) throw new ProvisioningValidationError("Telegram aktivdirsə düzgün chat ID allowlist tələb olunur.");
  if (telegramDefaultChatId && !telegramAllowedChatIds.split(",").map((x) => x.trim()).includes(telegramDefaultChatId)) throw new ProvisioningValidationError("Default Telegram chat ID allowlist daxilində olmalıdır.");
  if (!Number.isInteger(reportCount) || reportCount < 1 || reportCount > 6) throw new ProvisioningValidationError("Gündəlik report sayı 1–6 aralığında olmalıdır.");
  if (reportTimes.length !== reportCount || reportTimes.some((value) => !REPORT_TIME.test(value)) || new Set(reportTimes).size !== reportTimes.length) throw new ProvisioningValidationError("Report saatlarını düzgün və təkrarsız HH:MM formatında daxil edin.");
  const result: ProvisioningInput = {
    customerName, customerSlug, siteName, deviceName, deviceId,
    deviceModel: cleanString(input.deviceModel, 100) || "Shelly Pro 3EM",
    timezone: cleanString(input.timezone, 100) || "Asia/Baku",
    collectorMode,
    shellyServerUri: secureShellyUrl(cleanString(input.shellyServerUri, 300), "Server URI"),
    shellyCloudAuthKey: cleanString(input.shellyCloudAuthKey, 1000),
    influxOrg: cleanString(input.influxOrg, 100) || "HEAT",
    influxBucket: cleanString(input.influxBucket, 100) || "energy",
    influxAdminUsername: cleanString(input.influxAdminUsername, 100) || "heat-admin",
    influxAdminPassword, influxAdminToken,
    grafanaAdminUsername: cleanString(input.grafanaAdminUsername, 100) || "admin",
    grafanaAdminPassword, electricityTariffAznPerKwh, telegramEnabled,
    telegramReportCount: reportCount,
    telegramReportTimes: reportTimes.join(","),
    phaseALabel: cleanString(input.phaseALabel, 60) || "Faza A",
    phaseBLabel: cleanString(input.phaseBLabel, 60) || "Faza B",
    phaseCLabel: cleanString(input.phaseCLabel, 60) || "Faza C",
    businessType: cleanString(input.businessType, 120),
    workingHours: cleanString(input.workingHours, 200),
    closedDays: cleanString(input.closedDays, 120),
    majorEquipment: cleanString(input.majorEquipment, 1200),
    alwaysOnEquipment: cleanString(input.alwaysOnEquipment, 800),
    energyGoals: cleanString(input.energyGoals, 800),
    siteContext: cleanString(input.siteContext, 2000),
  };
  if (!result.shellyCloudAuthKey) throw new ProvisioningValidationError("Shelly Cloud Key tələb olunur.");
  if (collectorMode === "hybrid") {
    result.shellyOAuthAccessToken = cleanString(input.shellyOAuthAccessToken, 5000);
    result.shellyUserApiUrl = secureShellyUrl(cleanString(input.shellyUserApiUrl, 300), "User API URL");
    if (!result.shellyOAuthAccessToken) throw new ProvisioningValidationError("Hybrid rejim üçün OAuth token tələb olunur.");
  }
  if (telegramEnabled) {
    result.telegramBotToken = cleanString(input.telegramBotToken, 500);
    result.telegramAllowedChatIds = telegramAllowedChatIds;
    result.telegramDefaultChatId = telegramDefaultChatId || telegramAllowedChatIds.split(",")[0].trim();
    if (!result.telegramBotToken) throw new ProvisioningValidationError("Telegram bot token tələb olunur.");
  }
  return result;
}

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

export async function encryptProvisioningInput(input: ProvisioningInput): Promise<string> {
  const configured = getProvisioningEncryptionKey();
  const keyBytes = decodeBase64(configured);
  if (keyBytes.byteLength !== 32) throw new Error("Provisioning encryption key is not configured.");
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(input));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptProvisioningInput(payload: string): Promise<ProvisioningInput> {
  const [version, encodedIv, encodedCiphertext] = payload.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) throw new Error("Encrypted payload format is invalid.");
  const configured = getProvisioningEncryptionKey();
  const keyBytes = decodeBase64(configured);
  if (keyBytes.byteLength !== 32) throw new Error("Provisioning encryption key is not configured.");
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(encodedIv) },
    key,
    decodeBase64(encodedCiphertext),
  );
  return validateProvisioningInput(JSON.parse(new TextDecoder().decode(plaintext)));
}

export function requestIsSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(request.url).host;
    const forwardedHost = request.headers.get("x-forwarded-host");
    const hostHeader = request.headers.get("host");
    return (
      originHost === requestHost ||
      (forwardedHost !== null && originHost === forwardedHost) ||
      (hostHeader !== null && originHost === hostHeader) ||
      originHost.endsWith("heatenergyanalytics.com") ||
      originHost === "localhost" ||
      originHost.startsWith("localhost:") ||
      originHost === "127.0.0.1" ||
      originHost.startsWith("127.0.0.1:")
    );
  } catch {
    return false;
  }
}

export type AgentPrincipal =
  | { kind: "global" }
  | { kind: "customer"; customerId: string; customerSlug: string };

async function tokenDigest(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function safeTokenEqual(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([left, right].map(tokenDigest));
  let difference = left.length ^ right.length;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest.charCodeAt(index) ^ rightDigest.charCodeAt(index);
  }
  return difference === 0;
}

export async function getAgentPrincipal(request: Request): Promise<AgentPrincipal | null> {
  const expected = getProvisionerAgentToken();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!supplied || supplied.length < 24 || supplied.length > 200) return null;
  if (expected && await safeTokenEqual(expected, supplied)) return { kind: "global" };
  const [scoped] = await getDb().select({
    customerId: customerAgentTokens.customerId,
    customerSlug: customers.slug,
  }).from(customerAgentTokens)
    .innerJoin(customers, eq(customerAgentTokens.customerId, customers.id))
    .where(eq(customerAgentTokens.tokenHash, await tokenDigest(supplied)))
    .limit(1);
  return scoped ? { kind: "customer", ...scoped } : null;
}

export async function agentIsAuthorized(request: Request): Promise<boolean> {
  return Boolean(await getAgentPrincipal(request));
}

export async function globalAgentIsAuthorized(request: Request): Promise<boolean> {
  return (await getAgentPrincipal(request))?.kind === "global";
}

export function agentCanAccessSlug(principal: AgentPrincipal, slug: string): boolean {
  return principal.kind === "global" || principal.customerSlug === slug;
}

export async function hashAgentToken(token: string): Promise<string> {
  return tokenDigest(token);
}

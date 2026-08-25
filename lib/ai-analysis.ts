import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { aiAnalysisSettings, aiDailyAnalyses } from "@/db/schema";
import { buildDemoEnergyAnalysisPackage } from "@/lib/admin-energy-analysis";
import { DEMO_CUSTOMER, bakuDateKey } from "@/lib/demo-customer";

export const AI_ANALYSIS_SETTINGS_ID = "heat-gemini-analysis";
export const AI_ANALYSIS_MODEL = "gemini-2.5-flash";

export type AiAnalysisSettings = {
  enabled: boolean;
  reportTime: string;
  model: string;
  configured: boolean;
};

type StoredAiAnalysisSettings = AiAnalysisSettings & { apiKey: string };
type GeminiAnalysis = {
  status: "normal" | "attention" | "critical";
  executiveSummary: string;
  mainFinding: string;
  actions: string[];
  savingsOpportunity: string;
  caution: string;
};

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const API_KEY = /^[A-Za-z0-9_-]{20,200}$/;

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
  if (keyBytes.byteLength !== 32) throw new Error("AI analiz şifrələmə açarı hazır deyil.");
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, usage);
}

async function encryptApiKey(value: string): Promise<string> {
  const key = await encryptionKey(["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

async function decryptApiKey(payload: string): Promise<string> {
  const [version, encodedIv, encodedCiphertext] = payload.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) {
    throw new Error("AI analiz seyfi açıla bilmədi.");
  }
  const key = await encryptionKey(["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(encodedIv) },
    key,
    decodeBase64(encodedCiphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export function validateAiSettingsInput(input: {
  enabled?: unknown;
  reportTime?: unknown;
  apiKey?: unknown;
}): { enabled: boolean; reportTime: string; apiKey: string } {
  const reportTime = String(input.reportTime ?? "").trim();
  const apiKey = String(input.apiKey ?? "").trim();
  if (!TIME.test(reportTime)) throw new Error("Göndəriş vaxtını HH:MM formatında daxil edin.");
  if (apiKey && !API_KEY.test(apiKey)) throw new Error("Gemini API key formatı düzgün deyil.");
  return { enabled: input.enabled === true, reportTime, apiKey };
}

export async function loadAiAnalysisSettings(): Promise<StoredAiAnalysisSettings> {
  const [row] = await getDb().select().from(aiAnalysisSettings)
    .where(eq(aiAnalysisSettings.id, AI_ANALYSIS_SETTINGS_ID)).limit(1);
  if (!row) {
    return {
      enabled: false,
      reportTime: "09:00",
      model: AI_ANALYSIS_MODEL,
      configured: false,
      apiKey: "",
    };
  }
  try {
    const apiKey = await decryptApiKey(row.encryptedApiKey);
    return {
      enabled: row.enabled,
      reportTime: row.reportTime,
      model: row.model,
      configured: Boolean(apiKey),
      apiKey,
    };
  } catch {
    return {
      enabled: false,
      reportTime: row.reportTime,
      model: row.model,
      configured: false,
      apiKey: "",
    };
  }
}

export async function saveAiAnalysisSettings(input: {
  enabled: boolean;
  reportTime: string;
  apiKey: string;
}): Promise<AiAnalysisSettings> {
  const db = getDb();
  const [existing] = await db.select().from(aiAnalysisSettings)
    .where(eq(aiAnalysisSettings.id, AI_ANALYSIS_SETTINGS_ID)).limit(1);
  const encryptedApiKey = input.apiKey
    ? await encryptApiKey(input.apiKey)
    : existing?.encryptedApiKey;
  if (!encryptedApiKey) throw new Error("Gemini API key daxil edin.");
  const now = new Date().toISOString();
  await db.insert(aiAnalysisSettings).values({
    id: AI_ANALYSIS_SETTINGS_ID,
    encryptedApiKey,
    enabled: input.enabled,
    reportTime: input.reportTime,
    model: AI_ANALYSIS_MODEL,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: aiAnalysisSettings.id,
    set: {
      encryptedApiKey,
      enabled: input.enabled,
      reportTime: input.reportTime,
      model: AI_ANALYSIS_MODEL,
      updatedAt: now,
    },
  });
  return {
    enabled: input.enabled,
    reportTime: input.reportTime,
    model: AI_ANALYSIS_MODEL,
    configured: true,
  };
}

function validateGeminiAnalysis(value: unknown): GeminiAnalysis {
  if (!value || typeof value !== "object") throw new Error("Gemini cavabı düzgün deyil.");
  const item = value as Record<string, unknown>;
  const status = item.status;
  const actions = Array.isArray(item.actions)
    ? item.actions.filter((action): action is string => typeof action === "string").slice(0, 3)
    : [];
  if (status !== "normal" && status !== "attention" && status !== "critical") {
    throw new Error("Gemini statusu düzgün deyil.");
  }
  const text = (key: string, maximum: number) => {
    const result = typeof item[key] === "string" ? item[key].trim().slice(0, maximum) : "";
    if (!result) throw new Error("Gemini cavabı natamamdır.");
    return result;
  };
  if (actions.length === 0) throw new Error("Gemini tövsiyələri yoxdur.");
  return {
    status,
    executiveSummary: text("executiveSummary", 350),
    mainFinding: text("mainFinding", 300),
    actions: actions.map((action) => action.trim().slice(0, 180)).filter(Boolean),
    savingsOpportunity: text("savingsOpportunity", 250),
    caution: text("caution", 200),
  };
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<GeminiAnalysis> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              status: { type: "STRING", enum: ["normal", "attention", "critical"] },
              executiveSummary: { type: "STRING" },
              mainFinding: { type: "STRING" },
              actions: { type: "ARRAY", items: { type: "STRING" }, minItems: 1, maxItems: 3 },
              savingsOpportunity: { type: "STRING" },
              caution: { type: "STRING" },
            },
            required: [
              "status",
              "executiveSummary",
              "mainFinding",
              "actions",
              "savingsOpportunity",
              "caution",
            ],
          },
        },
      }),
      signal: AbortSignal.timeout(25000),
    },
  );
  const result = await response.json() as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (!response.ok) throw new Error(result.error?.message?.slice(0, 180) || "Gemini sorğusu uğursuz oldu.");
  const raw = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  return validateGeminiAnalysis(JSON.parse(raw));
}

function formatCustomerAnalysis(analysis: GeminiAnalysis): string {
  const status = analysis.status === "critical"
    ? "🔴 Təcili diqqət"
    : analysis.status === "attention"
      ? "🟠 Diqqət tələb edir"
      : "🟢 Normal";
  return `🤖 AI ENERJİ ANALİZİ

Vəziyyət: ${status}

Qısa icmal
${analysis.executiveSummary}

Əsas müşahidə
${analysis.mainFinding}

Tövsiyə olunan addımlar
${analysis.actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

Qənaət imkanı
${analysis.savingsOpportunity}

Qeyd
${analysis.caution}

Bu avtomatik ilkin analizdir; elektrik təhlükəsizliyi diaqnozu deyil.`;
}

export async function generateDemoAiAnalysis(): Promise<string> {
  const settings = await loadAiAnalysisSettings();
  if (!settings.enabled || !settings.configured || !settings.apiKey) {
    throw new Error("AI analizi aktiv deyil və ya Gemini API key saxlanmayıb.");
  }
  const prompt = await buildDemoEnergyAnalysisPackage();
  return formatCustomerAnalysis(await callGemini(settings.apiKey, settings.model, prompt));
}

export async function getOrCreateDemoDailyAiAnalysis(
  now = new Date(),
): Promise<{ text: string | null; generated: boolean; error: string | null }> {
  const settings = await loadAiAnalysisSettings();
  if (!settings.enabled || !settings.configured) {
    return { text: null, generated: false, error: null };
  }
  const localDate = bakuDateKey(now);
  const id = `${DEMO_CUSTOMER.id}:${localDate}`;
  const db = getDb();
  const [existing] = await db.select().from(aiDailyAnalyses)
    .where(eq(aiDailyAnalyses.id, id)).limit(1);
  if (existing?.status === "ready" && existing.analysisText) {
    return { text: existing.analysisText, generated: false, error: null };
  }
  try {
    const text = await generateDemoAiAnalysis();
    const updatedAt = new Date().toISOString();
    await db.insert(aiDailyAnalyses).values({
      id,
      customerId: DEMO_CUSTOMER.id,
      localDate,
      status: "ready",
      analysisText: text,
      errorMessage: null,
      model: settings.model,
      updatedAt,
    }).onConflictDoUpdate({
      target: aiDailyAnalyses.id,
      set: { status: "ready", analysisText: text, errorMessage: null, updatedAt },
    });
    return { text, generated: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 180) : "AI analizi yaradılmadı.";
    const updatedAt = new Date().toISOString();
    await db.insert(aiDailyAnalyses).values({
      id,
      customerId: DEMO_CUSTOMER.id,
      localDate,
      status: "failed",
      analysisText: null,
      errorMessage: message,
      model: settings.model,
      updatedAt,
    }).onConflictDoUpdate({
      target: aiDailyAnalyses.id,
      set: { status: "failed", analysisText: null, errorMessage: message, updatedAt },
    });
    return { text: null, generated: true, error: message };
  }
}

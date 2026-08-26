import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the HEAT product site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>HEAT \| Ağıllı enerji monitorinqi və analitikası<\/title>/i);
  assert.match(html, /Stop Paying for Invisible/);
  assert.match(html, /HEAT energy monitoring service/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("includes the customer intelligence and Telegram capabilities", async () => {
  const [dashboard, intelligence, telegram, schema, demoPage, publicDemo, telegramSetup] = await Promise.all([
    readFile(new URL("../components/admin/customer-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/customer-energy-intelligence.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/telegram.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/customers/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/provisioning/telegram-webhook/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dashboard, /CustomerEnergyIntelligence/);
  assert.match(intelligence, /Təxmini aylıq qənaət/);
  assert.match(intelligence, /İş saatından sonrakı itki/);
  assert.match(intelligence, /Enerji və qənaət mərkəzi/);
  for (const command of ["savings", "budget", "setbudget", "compare", "afterhours", "sethours", "peaks", "score", "recommendations", "contact"]) {
    assert.match(telegram, new RegExp(`command: "${command}"`));
  }
  assert.match(schema, /customer_energy_settings/);
  assert.match(schema, /customer_energy_snapshots/);
  assert.match(intelligence, /\/setbudget 750/);
  assert.match(intelligence, /\/sethours 09:00 23:00/);
  assert.match(demoPage, /intelligenceDemo/);
  assert.match(publicDemo, /Monthly Savings/);
  assert.match(publicDemo, /After-Hours Loss/);
  assert.match(publicDemo, /AI ACTION PLAN/);
  assert.match(telegramSetup, /setChatMenuButton/);
  assert.match(telegramSetup, /scope: \{ type: "default" \}/);
  assert.match(telegram, /if \(!command\.trim\(\)\.startsWith\("\/"\)\) command = "\/help"/);
  assert.match(telegram, /Məlumat almaq üçün uyğun komandanın üzərinə toxunun və ya onu yazın/);
  assert.match(telegram, /aylıq büdcə limitini dəyişir/);
  assert.match(telegram, /seçdiyiniz günün sərfiyyat və xərcini göstərir/);
  assert.match(telegram, /heat\.co2026@gmail\.com/);
});

test("admin bot provides a secure Gemini-ready demo analysis command", async () => {
  const [adminBot, webhook, analysis] = await Promise.all([
    readFile(new URL("../lib/admin-bot.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-bot/webhook/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-energy-analysis.ts", import.meta.url), "utf8"),
  ]);
  assert.match(adminBot, /command: "demoanaliz"/);
  assert.match(adminBot, /setMyCommands/);
  assert.match(webhook, /safeEqual/);
  assert.match(webhook, /chatId !== config\.secret\.chatId/);
  assert.match(analysis, /GEMINI NOTEBOOK ÜÇÜN GÜNLÜK ENERJİ MƏLUMAT PAKETİ/);
  assert.match(analysis, /SON 24 SAAT/);
  assert.match(analysis, /6 SAATLIQ İNTERVALLAR/);
  assert.match(analysis, /AYLIQ VƏ BÜDCƏ GÖSTƏRİCİLƏRİ/);
  assert.match(analysis, /GEMINI ÜÇÜN TAPŞIRIQ/);
  assert.doesNotMatch(analysis, /\.deviceId|\.botToken|AdminPassword|AdminToken/);
});

test("daily Gemini analysis is encrypted, admin-only, cached and safely appended", async () => {
  const [analysis, database, settingsRoute, testRoute, panel, scheduler, schema, migration] = await Promise.all([
    readFile(new URL("../lib/ai-analysis.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-ai/settings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-ai/test/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/ai-analysis-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/telegram/scheduled-reports/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0013_ai_analysis.sql", import.meta.url), "utf8"),
  ]);
  assert.match(analysis, /AES-GCM/);
  assert.match(analysis, /x-goog-api-key/);
  assert.match(analysis, /GEMINI_API_KEY\\s\*=\\s\*/);
  assert.match(analysis, /apiKey\.slice\(1, -1\)\.trim\(\)/);
  assert.match(analysis, /\{20,500\}/);
  assert.match(analysis, /responseMimeType: "application\/json"/);
  assert.match(analysis, /outputLimits = \[4096, 8192\]/);
  assert.match(analysis, /thinkingConfig: \{ thinkingLevel: "low" \}/);
  assert.match(analysis, /finishReason === "MAX_TOKENS"/);
  assert.match(analysis, /part\.thought !== true/);
  assert.match(analysis, /Gemini iki cəhddə də tam JSON cavabı qaytarmadı/);
  assert.match(analysis, /gemini-3\.6-flash/);
  assert.doesNotMatch(analysis, /temperature:/);
  assert.match(analysis, /aiDailyAnalyses/);
  assert.match(analysis, /readFromPrimary: true/);
  assert.match(database, /withSession\("first-primary"\)/);
  assert.doesNotMatch(settingsRoute, /apiKey: settings\.apiKey/);
  assert.match(settingsRoute, /getAdminUser/);
  assert.match(settingsRoute, /requestIsSameOrigin/);
  assert.match(testRoute, /ai_analysis_test/);
  assert.match(panel, /API key şifrəli saxlanır və bir daha brauzerə qaytarılmır/);
  assert.match(panel, /Testi Admin Bot-a göndər/);
  assert.match(panel, /Test düyməsi cari ayarları avtomatik saxlayır/);
  assert.match(panel, /const saveResponse = await fetch\("\/api\/admin-ai\/settings"/);
  assert.match(scheduler, /customer_ai_analysis_generated/);
  assert.match(scheduler, /Əsas enerji reportu uğurla göndərildi/);
  assert.match(scheduler, /text: customerMessage/);
  assert.match(schema, /ai_analysis_settings/);
  assert.match(migration, /CREATE TABLE `ai_daily_analyses`/);
  assert.match(migration, /PRAGMA optimize/);
});

test("customer Telegram reports are simple, customer-scoped and offer detailed commands", async () => {
  const [telegram, webhook, scheduler, analysisPackage, ai] = await Promise.all([
    readFile(new URL("../lib/telegram.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/telegram/webhook/[customerId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/telegram/scheduled-reports/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-energy-analysis.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/ai-analysis.ts", import.meta.url), "utf8"),
  ]);
  for (const command of ["status", "report", "last24h", "weekly", "monthly"]) {
    assert.match(webhook, new RegExp(`"/${command}":`));
  }
  assert.match(webhook, /customer_ai_analysis_delivered/);
  assert.match(webhook, /outgoingMessage = composeDailyTelegramMessage\(reply, analysis\.text\)/);
  assert.match(webhook, /REPORT və AI ANALİZİ eyni mesajda çatdırıldı/);
  assert.match(telegram, /command: "clear"/);
  assert.match(webhook, /callTelegram\(botToken, "deleteMessages"/);
  assert.match(webhook, /callTelegram\(botToken, "deleteMessage"/);
  assert.match(webhook, /Promise\.allSettled/);
  assert.match(webhook, /deletedCount === 0/);
  assert.match(webhook, /commandMessageId - 99/);
  assert.match(webhook, /customer_chat_cleared/);
  assert.match(webhook, /generateCustomerAiAnalysis\(customerId, values, analysisRequest\.period/);
  assert.match(webhook, /getOrCreateCustomerDailyAiAnalysis\(customerId, values\)/);
  assert.match(webhook, /"\/detailanalysis"/);
  assert.match(webhook, /"\/detailreport"/);
  assert.match(webhook, /Əsas report uğurla göndərildi/);
  assert.match(scheduler, /reportla eyni mesajda göndərildi/);
  assert.match(scheduler, /composeDailyTelegramMessage\(reportText, analysis\.text\)/);
  assert.match(scheduler, /getOrCreateCustomerDailyAiAnalysis\(vault\.customerId, values, now\)/);
  assert.doesNotMatch(scheduler, /customerSecrets\.customerId, DEMO_CUSTOMER\.id/);
  assert.doesNotMatch(scheduler, /reportText \+=/);
  assert.match(telegram, /Daha ətraflı report: \/detailreport/);
  assert.match(telegram, /Daha ətraflı AI analizi: \/detailanalysis/);
  assert.match(telegram, /REPORT — SON 24 SAAT/);
  assert.match(telegram, /REPORT — CANLI VƏZİYYƏT/);
  assert.match(telegram, /SADƏ İZAH/);
  assert.match(ai, /AI-NİN SADƏ İZAHI/);
  assert.match(ai, /\$\{analysis\.mainFinding\}/);
  assert.doesNotMatch(ai, /analysis\.keyFinding/);
  assert.match(ai, /!existing\.analysisText\.includes\("undefined"\)/);
  assert.match(analysisPackage, /heç başı çıxmayan biznes sahibinin anlayacağı formada/);
  assert.match(analysisPackage, /periodInstruction/);
  assert.match(analysisPackage, /müştərinin HEAT sisteminə ötürülmüş ölçmələri/);
  assert.match(ai, /HƏFTƏLİK AI ANALİZİ/);
  assert.match(ai, /AYLIQ AI ANALİZİ/);
});

test("weekly and month-end Telegram reports are admin-controlled and include AI in one message", async () => {
  const [panel, settingsRoute, scheduler, migration] = await Promise.all([
    readFile(new URL("../components/admin/ai-analysis-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-ai/settings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/telegram/scheduled-reports/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0014_slippery_karen_page.sql", import.meta.url), "utf8"),
  ]);
  assert.match(panel, /Həftəlik report — hər bazar günü/);
  assert.match(panel, /Aylıq report — ayın son günü/);
  assert.match(settingsRoute, /weeklyEnabled: settings\.weeklyEnabled/);
  assert.match(settingsRoute, /monthlyEnabled: settings\.monthlyEnabled/);
  assert.match(scheduler, /aiSettings\.weeklyEnabled && isSunday\(local\.date\)/);
  assert.match(scheduler, /aiSettings\.monthlyEnabled && isLastDayOfMonth\(local\.date\)/);
  assert.match(scheduler, /generateCustomerAiAnalysis\(vault\.customerId, values, period, "compact"\)/);
  assert.match(scheduler, /composeDailyTelegramMessage\(reportText, analysisText\)/);
  assert.match(migration, /ADD `weekly_enabled` integer DEFAULT false NOT NULL/);
  assert.match(migration, /ADD `monthly_enabled` integer DEFAULT false NOT NULL/);
});

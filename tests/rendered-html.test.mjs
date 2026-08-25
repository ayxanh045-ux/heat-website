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
  const [analysis, settingsRoute, testRoute, panel, scheduler, schema, migration] = await Promise.all([
    readFile(new URL("../lib/ai-analysis.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-ai/settings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-ai/test/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/ai-analysis-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/telegram/scheduled-reports/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0013_ai_analysis.sql", import.meta.url), "utf8"),
  ]);
  assert.match(analysis, /AES-GCM/);
  assert.match(analysis, /x-goog-api-key/);
  assert.match(analysis, /responseMimeType: "application\/json"/);
  assert.match(analysis, /gemini-2\.5-flash/);
  assert.match(analysis, /aiDailyAnalyses/);
  assert.doesNotMatch(settingsRoute, /apiKey: settings\.apiKey/);
  assert.match(settingsRoute, /getAdminUser/);
  assert.match(settingsRoute, /requestIsSameOrigin/);
  assert.match(testRoute, /ai_analysis_test/);
  assert.match(panel, /API key şifrəli saxlanır və bir daha brauzerə qaytarılmır/);
  assert.match(panel, /Testi Admin Bot-a göndər/);
  assert.match(scheduler, /customer_ai_analysis_generated/);
  assert.match(scheduler, /Əsas enerji reportu AI bölməsi olmadan göndəriləcək/);
  assert.match(scheduler, /3900 - reportText\.length/);
  assert.match(schema, /ai_analysis_settings/);
  assert.match(migration, /CREATE TABLE `ai_daily_analyses`/);
  assert.match(migration, /PRAGMA optimize/);
});

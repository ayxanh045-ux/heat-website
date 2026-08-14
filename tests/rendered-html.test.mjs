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
  assert.match(telegram, /Bu ay indiyədək xərc/);
  assert.match(telegram, /Bu mövzu üzrə məlumat yoxdur/);
  assert.match(telegram, /heat\.co2026@gmail\.com/);
});

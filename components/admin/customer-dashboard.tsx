"use client";

import { BrainCircuit, CalendarDays, ExternalLink, MessageCircle, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { ELECTRICITY_TARIFF_AZN_PER_KWH } from "@/lib/electricity";
import { useLanguage, type Language } from "@/components/i18n";
import { CustomerEnergyIntelligence } from "@/components/customer-energy-intelligence";

type Customer = {
  customerName: string;
  siteName: string;
  deviceName: string;
  deviceId: string;
  status: string;
  grafanaPort: number | null;
};

const SCENARIOS = {
  normal: {
    label: "Normal", power: "6.42 kW", energy: "80 kWh", projection: "301.25 AZN", formula: "2,410 kWh × 0.125 AZN", status: "Normal",
    phases: [58, 44, 36], phaseValues: ["2.71 kW", "2.04 kW", "1.67 kW"],
    insight: "İstehlak normaldır", detail: "Soyuducu və çay aparatının yükü gözlənilən iş rejimindədir. Hazırda müdaxilə tələb olunmur.",
    aiActions: ["Bağlanışdan sonra samovar və işıq xətlərini yoxlama siyahısı ilə nəzarət edin.", "Daim işləməli soyuducuların gecə sərfiyyatını ayrıca izləyin."],
    telegramTitle: "✅ Sistem normaldır", telegram: "Hazırkı güc: 6.42 kW\nBugünkü enerji: 84.7 kWh\nProblem aşkarlanmayıb.", tone: "ok",
    paths: ["M30 154 L80 158 L130 154 L180 143 L230 126 L280 100 L330 89 L380 99 L430 82 L480 69 L530 78 L580 64", "M30 165 L80 167 L130 160 L180 156 L230 141 L280 125 L330 114 L380 116 L430 106 L480 93 L530 98 L580 85", "M30 171 L80 169 L130 167 L180 160 L230 150 L280 136 L330 130 L380 123 L430 119 L480 107 L530 111 L580 101"],
  },
  peak: {
    label: "Pik yük", power: "11.86 kW", energy: "110 kWh", projection: "410.00 AZN", formula: "3,280 kWh × 0.125 AZN", status: "Diqqət",
    phases: [92, 71, 58], phaseValues: ["5.32 kW", "3.81 kW", "2.73 kW"],
    insight: "Pik yük müəyyən edildi", detail: "Çay aparatı, soba və kondisioner eyni vaxtda işləyir. Sobanın işini 15 dəqiqə gecikdirmək pik yükü azalda bilər.",
    aiActions: ["Yüksək güclü avadanlıqları 10–15 dəqiqə fərqlə işə salın.", "Pik təkrarlanarsa həmin saatdakı iş cədvəlini müqayisə edin."],
    telegramTitle: "⚠️ Pik yük xəbərdarlığı", telegram: "Hazırkı güc: 11.86 kW\nFaza A: 5.32 kW\nTövsiyə: sobanı 15 dəqiqə gecikdirin.", tone: "warn",
    paths: ["M30 154 L80 158 L130 154 L180 143 L230 126 L280 100 L330 86 L380 39 L430 27 L480 34 L530 56 L580 62", "M30 165 L80 167 L130 160 L180 156 L230 141 L280 125 L330 114 L380 82 L430 66 L480 71 L530 88 L580 85", "M30 171 L80 169 L130 167 L180 160 L230 150 L280 136 L330 130 L380 110 L430 99 L480 102 L530 109 L580 101"],
  },
  anomaly: {
    label: "Anomaliya", power: "9.34 kW", energy: "130 kWh", projection: "482.50 AZN", formula: "3,860 kWh × 0.125 AZN", status: "Anomaliya",
    phases: [98, 39, 31], phaseValues: ["6.10 kW", "1.81 kW", "1.43 kW"],
    insight: "Faza A-da qeyri-adi yük", detail: "Bağlanış saatından sonra Faza A-da 6.10 kW davamlı istehlak görünür. Çay aparatı və sobanın söndürüldüyünü yoxlayın.",
    aiActions: ["Faza A-ya bağlı avadanlıqları yerində yoxlayın.", "Yük davam edərsə ixtisaslı elektrikçidən xətti yoxlamasını istəyin."],
    telegramTitle: "🚨 Anomaliya aşkarlandı", telegram: "Saat: 01:42\nFaza A: 6.10 kW\nGecə bazasından 4.8× yüksəkdir.\nObyekti yoxlayın.", tone: "danger",
    paths: ["M30 40 L80 43 L130 39 L180 45 L230 41 L280 47 L330 42 L380 46 L430 40 L480 44 L530 38 L580 40", "M30 165 L80 167 L130 160 L180 156 L230 161 L280 158 L330 162 L380 159 L430 161 L480 156 L530 160 L580 158", "M30 171 L80 169 L130 167 L180 170 L230 166 L280 168 L330 165 L380 169 L430 167 L480 170 L530 166 L580 168"],
  },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

function seededRandom(seedText: string) {
  let seed = 2166136261;
  for (const char of seedText) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyDemoScenarios(dateKey: string, language: Language) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const completedDays = Math.max(1, day);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const random = seededRandom(dateKey);
  const totals = Array.from({ length: completedDays }, (_, index) => {
    const weekday = new Date(Date.UTC(year, month - 1, index + 1)).getUTCDay();
    const busyDay = weekday === 5 || weekday === 6 ? 10 : weekday === 0 ? -7 : 0;
    return 78 + busyDay + (random() - 0.5) * 16;
  });
  const latestEnergy = totals.at(-1) ?? 80;
  const actualEnergy = totals.reduce((sum, value) => sum + value, 0);
  const remainingDays = daysInMonth - completedDays;
  const baseProjection = actualEnergy + latestEnergy * remainingDays;
  const basePower = 5.7 + random() * 1.9;
  const locale = language === "az" ? "az-AZ" : language === "ru" ? "ru-RU" : "en-US";
  const lastDay = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, completedDays)));
  const makeScenario = (key: ScenarioKey, factor: number) => {
    const source = SCENARIOS[key];
    const power = basePower * factor;
    const energy = latestEnergy * factor;
    const projectedKwh = baseProjection * factor;
    const cost = projectedKwh * ELECTRICITY_TARIFF_AZN_PER_KWH;
    const shares = key === "anomaly" ? [0.66, 0.19, 0.15] : key === "peak" ? [0.45, 0.32, 0.23] : [0.42, 0.32, 0.26];
    const phaseValues = shares.map(share => `${(power * share).toFixed(2)} kW`);
    const telegramTitle = key === "normal" ? "✅ Sistem normaldır" : key === "peak" ? "⚠️ Pik yük xəbərdarlığı" : "🚨 Anomaliya aşkarlandı";
    const telegram = `Tarix: ${lastDay}\nHazırkı güc: ${power.toFixed(2)} kW\nSon gün: ${energy.toFixed(1)} kWh\nAylıq proqnoz: ${cost.toFixed(2)} AZN`;
    return { ...source, power: `${power.toFixed(2)} kW`, energy: `${energy.toFixed(1)} kWh`, projection: `${cost.toFixed(2)} AZN`, formula: `${Math.round(projectedKwh).toLocaleString("en-US")} kWh × ${ELECTRICITY_TARIFF_AZN_PER_KWH} AZN`, phaseValues, telegramTitle, telegram };
  };
  return { normal: makeScenario("normal", 1), peak: makeScenario("peak", 1.55), anomaly: makeScenario("anomaly", 1.32) };
}

function monthToDateSummary(dateKey: string, language: Language) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const random = seededRandom(`${year}-${String(month).padStart(2, "0")}-month-total`);
  const values = Array.from({ length: Math.max(1, day) }, (_, index) => {
    const weekday = new Date(Date.UTC(year, month - 1, index + 1)).getUTCDay();
    const adjustment = weekday === 5 || weekday === 6 ? 10 : weekday === 0 ? -7 : 0;
    return 78 + adjustment + (random() - 0.5) * 16;
  });
  const energyKwh = values.reduce((sum, value) => sum + value, 0);
  const locale = language === "az" ? "az-AZ" : language === "ru" ? "ru-RU" : "en-US";
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  return { energyKwh, costAzn: energyKwh * ELECTRICITY_TARIFF_AZN_PER_KWH, day, daysInMonth, monthName };
}

function phaseTitle(letter: string, label: string) {
  return label.trim().toLowerCase() === `faza ${letter.toLowerCase()}` ? `Faza ${letter}` : `Faza ${letter} — ${label}`;
}

export function CustomerDashboard({ customer, dailyDemoDate, customerView = false, intelligenceDemo = false, phaseLabels = ["Faza A", "Faza B", "Faza C"], hasAiContext = false }: { customer: Customer; dailyDemoDate?: string; customerView?: boolean; intelligenceDemo?: boolean; phaseLabels?: [string, string, string]; hasAiContext?: boolean }) {
  const { language } = useLanguage();
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("normal");
  const todayKey = dailyDemoDate ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const scenarios = dailyDemoScenarios(selectedDate, language);
  const current = scenarios[scenario];
  const monthTotal = monthToDateSummary(todayKey, language);
  const [realEnergy, setRealEnergy] = useState<{ selected: { energyKwh: number; costAzn: number } | null; monthToDate: { energyKwh: number; costAzn: number } } | null>(null);
  const [energyLoading, setEnergyLoading] = useState(customerView);
  useEffect(() => {
    if (!customerView) return;
    const controller = new AbortController();
    fetch(`/api/customer-energy?date=${encodeURIComponent(selectedDate)}`, { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("energy unavailable")))
      .then(data => setRealEnergy(data))
      .catch(error => { if (error.name !== "AbortError") setRealEnergy(null); })
      .finally(() => { if (!controller.signal.aborted) setEnergyLoading(false); });
    return () => controller.abort();
  }, [customerView, selectedDate]);
  const selectedEnergyKwh = realEnergy?.selected?.energyKwh ?? Number(current.energy.replace(/[^0-9.]/g, ""));
  const selectedDayCost = realEnergy?.selected?.costAzn ?? selectedEnergyKwh * ELECTRICITY_TARIFF_AZN_PER_KWH;
  const shownMonthTotal = realEnergy?.monthToDate ?? monthTotal;
  const selectedEnergyUnavailable = customerView && !energyLoading && (!realEnergy || !realEnergy.selected);
  return <div className={`customer-dashboard tone-${current.tone}`}>
    {!customerView && <div className="customer-demo-note"><Sparkles size={15} /><span>{dailyDemoDate ? "Gündəlik avtomatik demo" : "Demo görünüşü"}</span><p>{dailyDemoDate ? `${dailyDemoDate} tarixi üçün yaradılmış realist nümunə məlumatlarıdır. Sabah avtomatik yenilənəcək.` : "Real enerji məlumatları sistem aktiv olduqda Grafana-da görünəcək."}</p></div>}
    <div className="customer-dash-head"><div><span className="admin-kicker">ENERGY MONITORING</span><h1>{customer.customerName}</h1><p>{customer.siteName} · {customer.deviceName} · <code>{customer.deviceId}</code></p></div><div className="dashboard-controls"><label><CalendarDays size={15} /><span>Günü seç</span><input type="date" value={selectedDate} max={todayKey} onChange={(event) => { setEnergyLoading(true); setSelectedDate(event.target.value || todayKey); }} /></label><div className="dash-scenarios">{Object.entries(scenarios).map(([key, value]) => <button key={key} className={scenario === key ? "active" : ""} type="button" onClick={() => setScenario(key as keyof typeof SCENARIOS)}>{value.label}</button>)}</div></div></div>
    <div className="customer-pipeline"><span><i />Shelly qoşulub</span><span><i />InfluxDB yazır</span><span><i />Grafana hazırdır</span><span><i />Telegram aktivdir</span></div>
    <div className="customer-metrics"><div><span>Hazırkı güc</span><strong>{current.power}</strong><small>Canlı ölçü</small></div><div><span>Seçilmiş gün · {selectedDate}</span><strong>{energyLoading ? "…" : selectedEnergyUnavailable ? "Məlumat yoxdur" : `${selectedEnergyKwh.toFixed(1)} kWh`}</strong><small>{energyLoading || selectedEnergyUnavailable ? "—" : `${selectedDayCost.toFixed(2)} AZN`}</small></div><div><span>Aylıq proqnoz</span><strong>{current.projection}</strong><small>{current.formula}</small></div><div className="month-to-date-card"><span>Bu ay indiyədək · {monthTotal.monthName} ({monthTotal.daysInMonth}/{monthTotal.day})</span><strong>{energyLoading ? "…" : customerView && !realEnergy ? "Məlumat yoxdur" : `${shownMonthTotal.energyKwh.toFixed(1)} kWh`}</strong><small>{energyLoading ? "Yüklənir" : customerView && !realEnergy ? "—" : `${shownMonthTotal.costAzn.toFixed(2)} AZN · tarif ${ELECTRICITY_TARIFF_AZN_PER_KWH}`}</small></div><div><span>Sistem statusu</span><strong>{current.status}</strong><small>{current.tone === "ok" ? "Problem yoxdur" : "Yoxlama lazımdır"}</small></div></div>
    <div className="customer-dash-grid"><section className="customer-chart"><header><div><b>24 saatlıq güc</b><small>Qurulumda təyin edilmiş fazalar</small></div><div className="phase-chart-legend">{["A", "B", "C"].map((phase, index) => <span key={phase}><i />{phaseLabels[index]}</span>)}</div></header><svg viewBox="0 0 610 200" role="img" aria-label="Üç fazanın 24 saatlıq güc qrafiki"><line x1="30" y1="25" x2="590" y2="25"/><line x1="30" y1="80" x2="590" y2="80"/><line x1="30" y1="135" x2="590" y2="135"/><line x1="30" y1="180" x2="590" y2="180"/><path d={current.paths[0]}/><path d={current.paths[1]}/><path d={current.paths[2]}/><text x="30" y="197">00:00</text><text x="170" y="197">06:00</text><text x="310" y="197">12:00</text><text x="450" y="197">18:00</text><text x="555" y="197">24:00</text></svg></section><section className="customer-phases"><h2>Fazalar və xətlər</h2>{["A", "B", "C"].map((phase, index) => <div className="customer-phase" key={phase}><div><span>{phaseTitle(phase, phaseLabels[index])}</span><b>{current.phaseValues[index]}</b></div><i><b style={{ width: `${current.phases[index]}%` }} /></i></div>)}</section></div>
    <div className="customer-dash-lower"><section className="customer-insight customer-ai-advice"><span><BrainCircuit /></span><div><small>AI MƏSLƏHƏTLƏRİ · {dailyDemoDate ? "DEMO" : hasAiContext ? "MƏKAN PROFİLİ AKTİVDİR" : "ENERJİ ANALİZİ"}</small><h2>{current.insight}</h2><p>{current.detail}</p><ul>{current.aiActions.map(action => <li key={action}>{action}</li>)}</ul><em>Bu ilkin avtomatik analizdir; elektrik təhlükəsizliyi diaqnozu deyil.</em></div></section><section className="customer-telegram"><header><MessageCircle size={16} /><b>Telegram · HEAT Bot</b><i>online</i></header><div><b>{current.telegramTitle}</b><p>{current.telegram}</p><small>indi</small></div></section></div>
    {!customerView && (customer.status === "active" && customer.grafanaPort ? <a className="open-real-grafana" href={`http://localhost:${customer.grafanaPort}`}><Zap size={16} /> Real Grafana dashboardunu aç <ExternalLink size={14} /></a> : <div className="grafana-wait"><Zap size={16} /> Real Grafana keçidi qurulum tamamlandıqdan sonra aktiv olacaq.</div>)}
    {(customerView || intelligenceDemo) && <CustomerEnergyIntelligence demoMode={intelligenceDemo} />}
  </div>;
}

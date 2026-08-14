"use client";

import { BellRing, BrainCircuit, Clock3, Gauge, PiggyBank, Save, Settings2, TrendingDown, TrendingUp, WalletCards, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { EnergySettings } from "@/lib/customer-insights";

type Comparison = { currentKwh: number; previousKwh: number; differenceKwh: number; differenceAzn: number; percent: number };
type Insights = {
  savings: { energyKwh: number; amountAzn: number; percent: number; baseline: string };
  budget: { limitAzn: number; usedAzn: number; remainingAzn: number; percent: number; projectedAzn: number; warning: boolean };
  comparisons: { daily: Comparison; weekly: Comparison; monthly: Comparison };
  afterHours: { energyKwh: number; amountAzn: number; sharePercent: number; projectedMonthlyAzn: number };
  peaks: { measuredPeakKw: number; thresholdKw: number; hours: { hour: string; energyKwh: number; costAzn: number; peakKw: number }[] };
  score: { value: number; label: string };
  analysis: { potentialSavingAzn: number; recommendations: string[]; likelySource: string };
  settings: EnergySettings;
};

const comparisonLabels = { daily: "Bu gün / dünən", weekly: "Son 7 gün / əvvəlki 7 gün", monthly: "Bu ay / keçən ay" } as const;

export function CustomerEnergyIntelligence({ demoMode = false }: { demoMode?: boolean }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [settings, setSettings] = useState<EnergySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(demoMode ? "/api/demo-insights" : "/api/customer-insights", { cache: "no-store" });
      if (!response.ok) throw new Error("Analitika yüklənmədi.");
      const data = await response.json() as Insights;
      setInsights(data);
      setSettings(data.settings);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analitika yüklənmədi.");
    } finally { setLoading(false); }
  }, [demoMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const update = <K extends keyof EnergySettings>(key: K, value: EnergySettings[K]) => setSettings((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!settings) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/customer-settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Parametrlər saxlanmadı.");
      setMessage("Parametrlər saxlanıldı və analitika yeniləndi.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Parametrlər saxlanmadı."); }
    finally { setSaving(false); }
  };

  if (loading) return <section className="energy-suite-loading"><i /><span>HEAT Intelligence hesablanır…</span></section>;
  if (!insights || !settings) return <section className="energy-suite-loading error"><span>{message || "Analitika əlçatan deyil."}</span></section>;

  return <section className="energy-suite">
    <header className="energy-suite-head"><div><small>HEAT INTELLIGENCE</small><h2>Enerji və qənaət mərkəzi</h2><p>Sərfiyyatı pul, risk və konkret tədbirlərə çevirən biznes görünüşü.</p></div><div className={`energy-score score-${insights.score.value >= 70 ? "good" : "warn"}`}><Gauge size={18}/><span><b>{insights.score.value}/100</b><small>{insights.score.label}</small></span></div></header>

    <div className="energy-kpi-grid">
      <article><span><PiggyBank size={16}/> Təxmini aylıq qənaət</span><strong>{insights.savings.amountAzn.toFixed(2)} <small>AZN</small></strong><p>{insights.savings.energyKwh.toFixed(1)} kWh · {insights.savings.percent.toFixed(1)}% · {insights.savings.baseline}</p></article>
      <article className={insights.budget.warning ? "warning" : ""}><span><WalletCards size={16}/> Büdcə vəziyyəti</span><strong>{insights.budget.usedAzn.toFixed(2)} <small>/ {insights.budget.limitAzn.toFixed(0)} AZN</small></strong><i><b style={{ width: `${Math.min(100, insights.budget.percent)}%` }}/></i><p>{insights.budget.percent.toFixed(1)}% istifadə olunub · proqnoz {insights.budget.projectedAzn.toFixed(2)} AZN</p></article>
      <article><span><Clock3 size={16}/> İş saatından sonrakı itki</span><strong>{insights.afterHours.amountAzn.toFixed(2)} <small>AZN</small></strong><p>{insights.afterHours.energyKwh.toFixed(1)} kWh · ümumi sərfiyyatın {insights.afterHours.sharePercent.toFixed(1)}%-i</p></article>
      <article><span><Zap size={16}/> Pik güc</span><strong>{insights.peaks.measuredPeakKw.toFixed(2)} <small>kW</small></strong><p>Hədd {insights.peaks.thresholdKw.toFixed(1)} kW · mümkün mənbə: {insights.analysis.likelySource}</p></article>
    </div>

    <div className="energy-suite-grid">
      <section className="energy-panel"><header><TrendingUp size={16}/><div><b>Dövr müqayisələri</b><small>Dəyişiklik kVt·saat, AZN və faizlə</small></div></header><div className="comparison-list">{(Object.keys(comparisonLabels) as (keyof typeof comparisonLabels)[]).map((key) => { const item = insights.comparisons[key]; const down = item.differenceKwh <= 0; return <div key={key}><span>{down ? <TrendingDown/> : <TrendingUp/>}<i><b>{comparisonLabels[key]}</b><small>{item.currentKwh.toFixed(1)} kWh · əvvəl {item.previousKwh.toFixed(1)} kWh</small></i></span><strong className={down ? "positive" : "negative"}>{item.percent > 0 ? "+" : ""}{item.percent.toFixed(1)}%<small>{item.differenceAzn > 0 ? "+" : ""}{item.differenceAzn.toFixed(2)} AZN</small></strong></div>; })}</div></section>
      <section className="energy-panel"><header><Clock3 size={16}/><div><b>Ən çox sərfiyyat olan saatlar</b><small>Son ölçmələr üzrə TOP 3</small></div></header><div className="peak-hour-list">{insights.peaks.hours.length ? insights.peaks.hours.map((item, index) => <div key={item.hour}><em>0{index + 1}</em><span><b>{item.hour}</b><small>{item.energyKwh.toFixed(2)} kWh · {item.costAzn.toFixed(2)} AZN</small></span><strong>{item.peakKw.toFixed(2)} kW</strong></div>) : <p>Kifayət qədər saatlıq məlumat toplanmayıb.</p>}</div></section>
    </div>

    <section className="energy-action-panel"><span><BrainCircuit size={20}/></span><div><small>AI ƏSASLI FƏALİYYƏT PLANI</small><h3>Təxmini qənaət potensialı: {insights.analysis.potentialSavingAzn.toFixed(2)} AZN</h3><ul>{insights.analysis.recommendations.map((item) => <li key={item}>{item}</li>)}</ul><em>Bu avtomatik analitikadır; elektrik təhlükəsizliyi diaqnozu deyil.</em></div></section>

    <details className="energy-settings" open={!demoMode}><summary><span><Settings2 size={16}/><b>Büdcə və iş saatlarını dəyiş</b></span><small>{demoMode ? "Demo parametrləri · yalnız baxış" : "Saytdan redaktə et və yadda saxla"}</small></summary>{!demoMode && <p className="energy-settings-help">Eyni dəyişiklikləri Telegram-da <code>/setbudget 750</code> və <code>/sethours 09:00 23:00</code> komandaları ilə də edə bilərsiniz.</p>}<div className="energy-settings-grid">
      <label><span>Aylıq büdcə (AZN)</span><input disabled={demoMode} type="number" min="10" step="10" value={settings.monthlyBudgetAzn} onChange={(event) => update("monthlyBudgetAzn", Number(event.target.value))}/></label>
      <label><span>Büdcə xəbərdarlığı (%)</span><input disabled={demoMode} type="number" min="50" max="100" value={settings.budgetWarningPercent} onChange={(event) => update("budgetWarningPercent", Number(event.target.value))}/></label>
      <label><span>İşin başlama saatı</span><input disabled={demoMode} type="time" value={settings.workingHoursStart} onChange={(event) => update("workingHoursStart", event.target.value)}/></label>
      <label><span>İşin bitmə saatı</span><input disabled={demoMode} type="time" value={settings.workingHoursEnd} onChange={(event) => update("workingHoursEnd", event.target.value)}/></label>
      <label><span>Pik güc həddi (kW)</span><input disabled={demoMode} type="number" min="0.1" step="0.1" value={settings.peakThresholdKw} onChange={(event) => update("peakThresholdKw", Number(event.target.value))}/></label>
      <div className="energy-alert-switches"><b><BellRing size={15}/> Telegram xəbərdarlıqları</b>{([['alertBudget','Büdcə limiti'],['alertAfterHours','İş saatından sonrakı sərfiyyat'],['alertPeak','Pik güc'],['alertAnomaly','Anomaliya']] as [keyof EnergySettings,string][]).map(([key,label]) => <label key={key}><input disabled={demoMode} type="checkbox" checked={Boolean(settings[key])} onChange={(event) => update(key, event.target.checked as never)}/><i/><span>{label}</span></label>)}</div>
    </div><footer><p>{demoMode ? "Demo rejimində dəyişikliklər saxlanılmır." : message}</p>{!demoMode && <button type="button" disabled={saving} onClick={save}><Save size={15}/>{saving ? "Saxlanılır…" : "Parametrləri saxla"}</button>}</footer></details>
  </section>;
}

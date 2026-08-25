"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, Eye, EyeOff, Loader2, Save, Send, ShieldCheck } from "lucide-react";
import styles from "./ai-analysis-panel.module.css";

type Settings = {
  enabled: boolean;
  reportTime: string;
  model: string;
  configured: boolean;
};

const INITIAL: Settings = {
  enabled: false,
  reportTime: "09:00",
  model: "gemini-2.5-flash",
  configured: false,
};

export function AiAnalysisPanel() {
  const [settings, setSettings] = useState(INITIAL);
  const [apiKey, setApiKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin-ai/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as Settings & { error?: string };
        if (!response.ok) throw new Error(result.error || "AI ayarları oxunmadı.");
        if (active) setSettings(result);
      })
      .catch((problem) => active && setError(problem instanceof Error ? problem.message : "AI ayarları oxunmadı."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const save = async () => {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin-ai/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: settings.enabled, reportTime: settings.reportTime, apiKey }),
      });
      const result = await response.json() as Settings & { error?: string };
      if (!response.ok) throw new Error(result.error || "Ayarlar saxlanmadı.");
      setSettings(result); setApiKey("");
      setMessage("AI analiz ayarları təhlükəsiz saxlanıldı.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Ayarlar saxlanmadı.");
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin-ai/test", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Test göndərilmədi.");
      setMessage("Demo analizi yaradıldı və HEAT Admin Bot-a göndərildi.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Test göndərilmədi.");
    } finally { setTesting(false); }
  };

  return <section className={styles.panel} id="ai-analysis">
    <header className={styles.header}>
      <span className={styles.icon}><BrainCircuit size={23} /></span>
      <div><p>AVTOMATİK ANALİZ</p><h2>AI enerji analizi</h2><span>Demo hesabının gündəlik göstəricilərini analiz edib Telegram reportuna əlavə edir.</span></div>
      <label className={styles.switch}><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} disabled={loading} /><i /><b>{settings.enabled ? "Aktiv" : "Deaktiv"}</b></label>
    </header>
    {loading ? <div className={styles.loading}><Loader2 className="spin" size={18} /> Ayarlar yüklənir...</div> : <>
      <div className={styles.grid}>
        <label><span>Gemini API key</span><div className={styles.secret}><input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type={visible ? "text" : "password"} autoComplete="off" placeholder={settings.configured ? "Saxlanılıb — dəyişmək üçün yeni key yazın" : "AIza..."} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Açarı gizlət" : "Açarı göstər"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        <label><span>Gündəlik AI report saatı — Bakı vaxtı</span><input type="time" value={settings.reportTime} onChange={(event) => setSettings((current) => ({ ...current, reportTime: event.target.value }))} /></label>
        <label><span>Analiz modeli</span><input value={settings.model} disabled /></label>
      </div>
      <div className={styles.security}><ShieldCheck size={17} /><span>API key şifrəli saxlanır və bir daha brauzerə qaytarılmır. Gemini-yə yalnız enerji göstəriciləri və məkan konteksti göndərilir.</span></div>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {message && <div className={styles.success}><CheckCircle2 size={16} />{message}</div>}
      <footer><span>{settings.configured ? "Gemini açarı saxlanılıb" : "Gemini açarı hələ əlavə edilməyib"}</span><div><button type="button" className={styles.test} onClick={test} disabled={testing || saving || !settings.configured || !settings.enabled}>{testing ? <Loader2 className="spin" size={16} /> : <Send size={16} />}Testi Admin Bot-a göndər</button><button type="button" className={styles.save} onClick={save} disabled={saving || testing}>{saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}Ayarları saxla</button></div></footer>
    </>}
  </section>;
}

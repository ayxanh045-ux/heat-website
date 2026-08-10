"use client";

import { AlertTriangle, ArrowLeft, Bot, CheckCircle2, Eye, EyeOff, Loader2, Save, Send, ShieldCheck, Siren } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProvisioningInput } from "@/lib/provisioning";

type EditableValues = ProvisioningInput & {
  shellyOAuthAccessToken?: string; shellyUserApiUrl?: string; telegramBotToken?: string;
  telegramAllowedChatIds?: string; telegramDefaultChatId?: string;
};

function EditField({ label, value, onChange, secret = false, placeholder = "", required = true, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; secret?: boolean; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return <label className="admin-field"><span>{label}</span><div className="admin-input-wrap"><input value={value} onChange={event => onChange(event.target.value)} type={secret && !visible ? "password" : "text"} placeholder={placeholder} required={required} disabled={disabled} autoComplete="off" />{secret && <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Gizlət" : "Göstər"}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>}</div></label>;
}

export function CustomerEditForm({ customerId }: { customerId: string }) {
  const [values, setValues] = useState<EditableValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<"queued" | "demo" | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingScenario, setTestingScenario] = useState<"peak" | "anomaly" | null>(null);
  const [activatingCommands, setActivatingCommands] = useState(false);
  const [telegramResult, setTelegramResult] = useState("");
  useEffect(() => {
    fetch(`/api/provisioning/customers/${encodeURIComponent(customerId)}`, { cache: "no-store" }).then(async response => {
      const result = await response.json() as { values?: EditableValues; error?: string };
      if (!response.ok || !result.values) throw new Error(result.error || "Məlumatlar açıla bilmədi.");
      setValues(result.values);
    }).catch(problem => setError(problem instanceof Error ? problem.message : "Məlumatlar açıla bilmədi.")).finally(() => setLoading(false));
  }, [customerId]);
  const set = (key: keyof EditableValues, value: string | boolean) => setValues(current => current ? { ...current, [key]: value } : current);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!values) return; setSaving(true); setError("");
    try {
      const response = await fetch(`/api/provisioning/customers/${encodeURIComponent(customerId)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { error?: string; demo?: boolean };
      if (!response.ok) throw new Error(result.error || "Məlumatlar saxlanmadı.");
      setSaved(result.demo ? "demo" : "queued");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Məlumatlar saxlanmadı."); }
    finally { setSaving(false); }
  };
  const testTelegram = async () => {
    setTestingTelegram(true); setTelegramResult(""); setError("");
    try {
      const response = await fetch("/api/provisioning/telegram-test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerId }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Test bildirişi göndərilmədi.");
      setTelegramResult("Müştəri hesabatı Telegram-a göndərildi.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Test bildirişi göndərilmədi."); }
    finally { setTestingTelegram(false); }
  };
  const testTelegramScenario = async (scenario: "peak" | "anomaly") => {
    setTestingScenario(scenario); setTelegramResult(""); setError("");
    try {
      const response = await fetch("/api/provisioning/telegram-test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerId, scenario }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Xəbərdarlıq göndərilmədi.");
      setTelegramResult(scenario === "peak" ? "Pik güc xəbərdarlığı Telegram-a göndərildi." : "Anomaliya xəbərdarlığı Telegram-a göndərildi.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Xəbərdarlıq göndərilmədi."); }
    finally { setTestingScenario(null); }
  };
  const activateTelegramCommands = async () => {
    setActivatingCommands(true); setTelegramResult(""); setError("");
    try {
      const response = await fetch("/api/provisioning/telegram-webhook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerId }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Bot komandaları aktiv edilmədi.");
      setTelegramResult("Bot komandaları aktivdir. Telegram-da /status və ya /report yazın.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Bot komandaları aktiv edilmədi."); }
    finally { setActivatingCommands(false); }
  };
  if (loading) return <main className="customer-edit-state"><Loader2 className="spin" /><b>Müştəri məlumatları təhlükəsiz şəkildə açılır</b></main>;
  if (!values) return <main className="customer-edit-state error"><ShieldCheck /><b>{error}</b><a href="/admin">Admin panelinə qayıt</a></main>;
  if (saved) return <main className="customer-edit-success"><CheckCircle2 /><h1>{saved === "demo" ? "Demo məlumatları saxlandı" : "Yenilənmə növbəyə əlavə edildi"}</h1><p>{saved === "demo" ? "Bu dəyişikliklər yalnız test hesabına aiddir." : "Lokal sistem yeni məlumatları tətbiq edib xidmətləri yenidən başladacaq."}</p><a href="/admin">Müştəri siyahısına qayıt</a></main>;
  return <main className="customer-edit-page"><a className="dashboard-back" href="/admin"><ArrowLeft size={15} /> Müştəri siyahısına qayıt</a><header><span className="admin-kicker">MÜŞTƏRİ REDAKTƏSİ</span><h1>{values.customerName}</h1><p>Obyekt, Shelly və Telegram məlumatlarını təhlükəsiz şəkildə yenilə.</p></header><form className="customer-edit-form" onSubmit={submit}>
    <section><h2>Müştəri və obyekt</h2><div className="admin-form-grid"><EditField label="Müştəri adı" value={values.customerName} onChange={value => set("customerName", value)} /><EditField label="Müştəri slug — dəyişdirilmir" value={values.customerSlug} onChange={() => undefined} disabled /><EditField label="Obyekt adı" value={values.siteName} onChange={value => set("siteName", value)} /><EditField label="Cihaz adı" value={values.deviceName} onChange={value => set("deviceName", value)} /><EditField label="Shelly Device ID" value={values.deviceId} onChange={value => set("deviceId", value)} /></div></section>
    <section><h2>Shelly Cloud</h2><div className="admin-form-grid"><label className="admin-field"><span>Collector rejimi</span><select value={values.collectorMode} onChange={event => set("collectorMode", event.target.value)}><option value="polling">Polling</option><option value="hybrid">Hybrid</option></select></label><EditField label="Server URI" value={values.shellyServerUri} onChange={value => set("shellyServerUri", value)} /><EditField label="Cloud Key" value={values.shellyCloudAuthKey} onChange={value => set("shellyCloudAuthKey", value)} secret />{values.collectorMode === "hybrid" && <><EditField label="OAuth access token" value={values.shellyOAuthAccessToken || ""} onChange={value => set("shellyOAuthAccessToken", value)} secret /><EditField label="User API URL" value={values.shellyUserApiUrl || ""} onChange={value => set("shellyUserApiUrl", value)} /></>}</div></section>
    <section><div className="customer-edit-section-head"><div><h2>Telegram bildirişləri</h2><p>Bot tokenini və bildirişin gedəcəyi chat ID-ni buradan dəyiş.</p></div><div className="telegram-edit-actions">{values.telegramEnabled && <><button type="button" className="telegram-test-button" onClick={activateTelegramCommands} disabled={activatingCommands}>{activatingCommands ? <Loader2 className="spin" size={14} /> : <Bot size={14} />} Komandaları aktiv et</button><button type="button" className="telegram-test-button" onClick={testTelegram} disabled={testingTelegram}>{testingTelegram ? <Loader2 className="spin" size={14} /> : <Send size={14} />} Hesabat göndər</button><button type="button" className="telegram-test-button telegram-peak-button" onClick={() => testTelegramScenario("peak")} disabled={testingScenario !== null}>{testingScenario === "peak" ? <Loader2 className="spin" size={14} /> : <AlertTriangle size={14} />} Pik testi</button><button type="button" className="telegram-test-button telegram-anomaly-button" onClick={() => testTelegramScenario("anomaly")} disabled={testingScenario !== null}>{testingScenario === "anomaly" ? <Loader2 className="spin" size={14} /> : <Siren size={14} />} Anomaliya testi</button></>}<label className="admin-switch"><input type="checkbox" checked={values.telegramEnabled} onChange={event => set("telegramEnabled", event.target.checked)} /><i /><span>Aktiv et</span></label></div></div>{values.telegramEnabled && <div className="admin-form-grid"><EditField label="Bot token" value={values.telegramBotToken || ""} onChange={value => set("telegramBotToken", value)} secret /><EditField label="Allowed chat ID-lər" value={values.telegramAllowedChatIds || ""} onChange={value => set("telegramAllowedChatIds", value)} placeholder="123456789,-100123456789" /><EditField label="Default chat ID" value={values.telegramDefaultChatId || ""} onChange={value => set("telegramDefaultChatId", value)} required={false} /></div>}{telegramResult && <div className="telegram-test-success"><CheckCircle2 size={15} /> {telegramResult}</div>}</section>
    {error && <div className="admin-error">{error}</div>}<footer><div><ShieldCheck size={17} /> Dəyişikliklər şifrələnmiş seyfdə saxlanır.</div><button disabled={saving}>{saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}{saving ? "Saxlanır..." : "Dəyişiklikləri saxla"}</button></footer>
  </form></main>;
}

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Plus, ShieldCheck, Sparkles } from "lucide-react";

type Fields = {
  customerName: string; customerSlug: string; siteName: string; deviceName: string;
  deviceId: string; deviceModel: string; timezone: string; collectorMode: "polling" | "hybrid";
  shellyServerUri: string; shellyCloudAuthKey: string; shellyOAuthAccessToken: string; shellyUserApiUrl: string;
  influxOrg: string; influxBucket: string; influxAdminUsername: string; influxAdminPassword: string; influxAdminToken: string;
  grafanaAdminUsername: string; grafanaAdminPassword: string; telegramEnabled: boolean;
  telegramBotToken: string; telegramAllowedChatIds: string; telegramDefaultChatId: string;
};

const INITIAL: Fields = {
  customerName: "", customerSlug: "", siteName: "", deviceName: "Baş elektrik paneli",
  deviceId: "", deviceModel: "Shelly Pro 3EM", timezone: "Asia/Baku", collectorMode: "polling",
  shellyServerUri: "", shellyCloudAuthKey: "", shellyOAuthAccessToken: "", shellyUserApiUrl: "",
  influxOrg: "HEAT", influxBucket: "energy", influxAdminUsername: "heat-admin", influxAdminPassword: "", influxAdminToken: "",
  grafanaAdminUsername: "admin", grafanaAdminPassword: "", telegramEnabled: false,
  telegramBotToken: "", telegramAllowedChatIds: "", telegramDefaultChatId: "",
};

function randomSecret(length = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function Field({ label, name, value, onChange, type = "text", placeholder, required = true }: {
  label: string; name: keyof Fields; value: string; onChange: (name: keyof Fields, value: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const secret = type === "password";
  return <label className="admin-field"><span>{label}{required && <b>*</b>}</span><div className="admin-input-wrap">
    <input name={name} value={value} required={required} type={secret && visible ? "text" : type} placeholder={placeholder} onChange={(event) => onChange(name, event.target.value)} autoComplete="off" />
    {secret && <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Dəyəri gizlət" : "Dəyəri göstər"}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
  </div></label>;
}

export function ProvisioningForm() {
  const [fields, setFields] = useState(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ jobId: string } | null>(null);
  const progress = useMemo(() => {
    const required = [fields.customerName, fields.customerSlug, fields.siteName, fields.deviceId, fields.shellyServerUri, fields.shellyCloudAuthKey, fields.influxAdminPassword, fields.influxAdminToken, fields.grafanaAdminPassword];
    return Math.round((required.filter(Boolean).length / required.length) * 100);
  }, [fields]);
  const set = (name: keyof Fields, value: string | boolean) => setFields((current) => ({ ...current, [name]: value }));
  const generate = () => setFields((current) => ({ ...current, influxAdminPassword: randomSecret(18), influxAdminToken: randomSecret(32), grafanaAdminPassword: randomSecret(18) }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/provisioning/customers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fields) });
      const result = await response.json() as { error?: string; jobId?: string };
      if (!response.ok || !result.jobId) throw new Error(result.error || "Müştəri yaradıla bilmədi.");
      setCreated({ jobId: result.jobId }); setFields(INITIAL);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Gözlənilməz xəta baş verdi."); }
    finally { setBusy(false); }
  };
  if (created) return <div className="admin-success"><CheckCircle2 size={42} /><h2>Müştəri növbəyə əlavə edildi</h2><p>Lokal provisioner agent sistemi quracaq. Status siyahıda avtomatik yenilənəcək.</p><code>{created.jobId}</code><button onClick={() => setCreated(null)}><Plus size={16} /> Yeni müştəri</button></div>;
  return <form className="provision-form" onSubmit={submit}>
    <div className="form-progress"><span>Hazırlıq</span><strong>{progress}%</strong><i><b style={{ width: `${progress}%` }} /></i></div>
    <section><div className="admin-section-title"><span>01</span><div><h2>Müştəri və obyekt</h2><p>Sistemdə görünəcək identifikasiya məlumatları.</p></div></div><div className="admin-form-grid">
      <Field label="Müştəri adı" name="customerName" value={fields.customerName} onChange={set} placeholder="Məsələn: Caspian Coffee" />
      <Field label="Müştəri slug" name="customerSlug" value={fields.customerSlug} onChange={set} placeholder="caspian-coffee" />
      <Field label="Obyekt adı" name="siteName" value={fields.siteName} onChange={set} placeholder="Nizami filialı" />
      <Field label="Cihaz adı" name="deviceName" value={fields.deviceName} onChange={set} />
      <Field label="Shelly Device ID" name="deviceId" value={fields.deviceId} onChange={set} placeholder="a1b2c3d4e5f6" />
      <Field label="Cihaz modeli" name="deviceModel" value={fields.deviceModel} onChange={set} />
    </div></section>
    <section><div className="admin-section-title"><span>02</span><div><h2>Shelly Cloud</h2><p>Cloud Key yalnız şifrələnmiş halda job queue-da saxlanır.</p></div></div><div className="admin-form-grid">
      <label className="admin-field"><span>Collector rejimi<b>*</b></span><select value={fields.collectorMode} onChange={(e) => set("collectorMode", e.target.value)}><option value="polling">Polling — ilk quraşdırma</option><option value="hybrid">Hybrid — real-time + fallback</option></select></label>
      <Field label="Server URI" name="shellyServerUri" value={fields.shellyServerUri} onChange={set} placeholder="https://shelly-xx-eu.shelly.cloud" />
      <Field label="Authorization Cloud Key" name="shellyCloudAuthKey" value={fields.shellyCloudAuthKey} onChange={set} type="password" />
      {fields.collectorMode === "hybrid" && <><Field label="OAuth access token" name="shellyOAuthAccessToken" value={fields.shellyOAuthAccessToken} onChange={set} type="password" /><Field label="User API URL" name="shellyUserApiUrl" value={fields.shellyUserApiUrl} onChange={set} placeholder="https://shelly-xx-eu.shelly.cloud" /></>}
    </div></section>
    <section><div className="admin-section-title"><span>03</span><div><h2>InfluxDB və Grafana</h2><p>İstəsəniz təhlükəsiz dəyərləri platforma yaratsın.</p></div><button className="generate-secrets" type="button" onClick={generate}><Sparkles size={15} /> Təhlükəsiz dəyərlər yarat</button></div><div className="admin-form-grid">
      <Field label="Influx organization" name="influxOrg" value={fields.influxOrg} onChange={set} />
      <Field label="Influx bucket" name="influxBucket" value={fields.influxBucket} onChange={set} />
      <Field label="Influx admin username" name="influxAdminUsername" value={fields.influxAdminUsername} onChange={set} />
      <Field label="Influx admin password" name="influxAdminPassword" value={fields.influxAdminPassword} onChange={set} type="password" />
      <Field label="Influx init admin token" name="influxAdminToken" value={fields.influxAdminToken} onChange={set} type="password" />
      <Field label="Grafana admin username" name="grafanaAdminUsername" value={fields.grafanaAdminUsername} onChange={set} />
      <Field label="Grafana admin password" name="grafanaAdminPassword" value={fields.grafanaAdminPassword} onChange={set} type="password" />
    </div><div className="auto-token-note"><ShieldCheck size={16} /><span>Write, analytics-read və Grafana-read tokenləri quraşdırma zamanı avtomatik yaradılır.</span></div></section>
    <section><div className="admin-section-title"><span>04</span><div><h2>Telegram</h2><p>İstəyə bağlı bildiriş və hesabat kanalı.</p></div><label className="admin-switch"><input type="checkbox" checked={fields.telegramEnabled} onChange={(e) => set("telegramEnabled", e.target.checked)} /><i /><span>Aktiv et</span></label></div>{fields.telegramEnabled && <div className="admin-form-grid">
      <Field label="Bot token" name="telegramBotToken" value={fields.telegramBotToken} onChange={set} type="password" />
      <Field label="Allowed chat ID-lər" name="telegramAllowedChatIds" value={fields.telegramAllowedChatIds} onChange={set} placeholder="123456789,-100123456789" />
      <Field label="Default chat ID" name="telegramDefaultChatId" value={fields.telegramDefaultChatId} onChange={set} placeholder="123456789" required={false} />
    </div>}</section>
    {error && <div className="admin-error" role="alert">{error}</div>}
    <div className="admin-submit-row"><div><ShieldCheck size={18} /><span>Secretlər bazaya açıq mətn kimi yazılmır.</span></div><button disabled={busy} type="submit">{busy ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}{busy ? "Növbəyə əlavə edilir" : "Müştəri sistemini qur"}</button></div>
  </form>;
}

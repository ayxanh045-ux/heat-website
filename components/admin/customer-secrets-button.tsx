"use client";

import { Check, Copy, Eye, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

type SecretValues = Record<string, string | boolean | undefined>;

const GROUPS = [
  {
    title: "Shelly Cloud",
    fields: [
      ["Shelly Device ID", "deviceId"], ["Server URI", "shellyServerUri"],
      ["Cloud Key", "shellyCloudAuthKey"], ["OAuth access token", "shellyOAuthAccessToken"],
      ["User API URL", "shellyUserApiUrl"],
    ],
  },
  {
    title: "InfluxDB",
    fields: [
      ["Organization", "influxOrg"], ["Bucket", "influxBucket"],
      ["Admin username", "influxAdminUsername"], ["Admin password", "influxAdminPassword"],
      ["Init admin token", "influxAdminToken"],
    ],
  },
  {
    title: "Grafana",
    fields: [["Admin username", "grafanaAdminUsername"], ["Admin password", "grafanaAdminPassword"]],
  },
  {
    title: "Telegram",
    fields: [
      ["Bot token", "telegramBotToken"], ["Allowed chat ID-lər", "telegramAllowedChatIds"],
      ["Default chat ID", "telegramDefaultChatId"],
    ],
  },
] as const;

export function CustomerSecretsButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secrets, setSecrets] = useState<SecretValues | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const reveal = async () => {
    setOpen(true); setLoading(true); setError(""); setSecrets(null);
    try {
      const response = await fetch("/api/provisioning/secrets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const result = await response.json() as { secrets?: SecretValues; error?: string };
      if (!response.ok || !result.secrets) throw new Error(result.error || "Məlumatlar açıla bilmədi.");
      setSecrets(result.secrets);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Məlumatlar açıla bilmədi.");
    } finally { setLoading(false); }
  };

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value); setCopied(key);
    window.setTimeout(() => setCopied(""), 1500);
  };

  return <>
    <button className="vault-open" type="button" onClick={reveal}><Eye size={14} /> Seyfə bax</button>
    {open && <div className="vault-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="vault-modal" role="dialog" aria-modal="true" aria-label={`${customerName} gizli məlumatları`}>
        <header><div><span><ShieldCheck size={19} /></span><div><small>ŞİFRƏLƏNMİŞ MÜŞTƏRİ SEYFİ</small><h2>{customerName}</h2></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Bağla"><X size={19} /></button></header>
        {loading && <div className="vault-state"><Loader2 className="spin" size={25} /><b>Məlumatlar təhlükəsiz şəkildə açılır</b></div>}
        {error && <div className="vault-state error"><ShieldCheck size={25} /><b>{error}</b></div>}
        {secrets && <div className="vault-groups">{GROUPS.map((group) => {
          const visible = group.fields.filter(([, key]) => typeof secrets[key] === "string" && secrets[key]);
          if (!visible.length) return null;
          return <div className="vault-group" key={group.title}><h3>{group.title}</h3>{visible.map(([label, key]) => {
            const value = String(secrets[key]);
            return <div className="vault-row" key={key}><span>{label}</span><code>{value}</code><button type="button" onClick={() => copy(key, value)} aria-label={`${label} kopyala`}>{copied === key ? <Check size={14} /> : <Copy size={14} />}</button></div>;
          })}</div>;
        })}<p className="vault-warning"><ShieldCheck size={15} /> Bu məlumatları yalnız etibar etdiyiniz şəxslərlə paylaşın.</p></div>}
      </section>
    </div>}
  </>;
}

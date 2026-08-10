"use client";

import { Check, Copy, KeyRound, Loader2, X } from "lucide-react";
import { useState } from "react";

export function CustomerAppToken({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const create = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/customer-auth/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customerId }) });
      const result = await response.json() as { token?: string; error?: string };
      if (!response.ok || !result.token) throw new Error(result.error || "Token yaradıla bilmədi.");
      setToken(result.token);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Token yaradıla bilmədi."); }
    finally { setBusy(false); }
  };
  const copy = async () => { await navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return <>
    <button className="app-token-open" type="button" onClick={create} disabled={busy}>{busy ? <Loader2 className="spin" size={14} /> : <KeyRound size={14} />} Müştəri tokeni</button>
    {(token || error) && <div className="token-backdrop"><section className="token-modal" role="dialog" aria-modal="true" aria-label={`${customerName} mobil tokeni`}>
      <button className="token-close" onClick={() => { setToken(""); setError(""); }} aria-label="Bağla"><X size={18} /></button>
      <span><KeyRound size={22} /></span><small>MÜŞTƏRİ PORTAL GİRİŞİ</small><h2>{customerName}</h2>
      {error ? <p className="token-error">{error}</p> : <><p>Bu token yalnız bu müştərinin dashboardunu açır. Müştəriyə təhlükəsiz şəkildə göndərin. Yeni token yaradıldıqda köhnə girişlər bağlanır.</p><div><code>{token}</code><button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div><a href="/customer" target="_blank">Müştəri giriş səhifəsini aç</a></>}
    </section></div>}
  </>;
}

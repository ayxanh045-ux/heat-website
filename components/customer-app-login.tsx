"use client";

import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";

export function CustomerAppLogin() {
  const [token, setToken] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/customer-auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Giriş alınmadı.");
      window.location.assign("/app/dashboard");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Giriş alınmadı."); }
    finally { setBusy(false); }
  };
  return <form className="customer-login-card" onSubmit={login}>
    <div className="customer-login-brand"><span>H</span><div><b>HEAT</b><small>ENERGY ANALYTICS</small></div></div>
    <div className="customer-login-icon"><LockKeyhole size={23} /></div><span className="admin-kicker">MÜŞTƏRİ TƏTBİQİ</span><h1>Enerjinizi izləyin</h1><p>HEAT tərəfindən sizə verilmiş şəxsi giriş tokenini daxil edin.</p>
    <label><span>Giriş tokeni</span><div><input autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} type={visible ? "text" : "password"} value={token} onChange={event => setToken(event.target.value)} placeholder="HEAT-••••••••••••" required /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Tokeni gizlət" : "Tokeni göstər"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
    {error && <div className="customer-login-error">{error}</div>}
    <button className="customer-login-submit" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={18} />}{busy ? "Yoxlanılır..." : "Dashboarda daxil ol"}</button>
    <small className="customer-login-help">Tokeninizi itirmisinizsə HEAT administratoru ilə əlaqə saxlayın.</small>
  </form>;
}

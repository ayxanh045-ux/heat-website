"use client";

import { useState } from "react";
import { KeyRound, Loader2, LockKeyhole } from "lucide-react";

export function DeviceSetupForm({ returnTo }: { returnTo: string }) {
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/device-setup", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ setupToken }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Cihaz təsdiqlənmədi.");
      window.location.assign(returnTo.startsWith("/admin") ? returnTo : "/admin");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Gözlənilməz xəta baş verdi.");
    } finally { setBusy(false); }
  };

  return <form className="admin-device-card" onSubmit={submit}>
    <span><LockKeyhole size={25} /></span>
    <small>İKİNCİ TƏHLÜKƏSİZLİK KİLİDİ</small>
    <h1>Bu brauzeri admin cihazı et</h1>
    <p>Admin paneli yalnız bu kompüterdə istifadə etdiyiniz hazırkı brauzerdə açılacaq. Quraşdırma kodunu bir dəfə daxil edin.</p>
    <label><b>Birdəfəlik quraşdırma kodu</b><div><KeyRound size={17} /><input type="password" value={setupToken} onChange={(event) => setSetupToken(event.target.value)} autoComplete="one-time-code" required minLength={24} /></div></label>
    {error && <div className="admin-device-error">{error}</div>}
    <button disabled={busy || setupToken.length < 24}>{busy ? <Loader2 className="spin" size={17} /> : <LockKeyhole size={17} />}{busy ? "Təsdiqlənir…" : "Bu cihazı təsdiqlə"}</button>
    <em>Başqa cihaz və brauzerlər düzgün admin hesabı ilə belə daxil ola bilməyəcək.</em>
  </form>;
}

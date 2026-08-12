"use client";

import { useEffect, useState } from "react";
import { BellRing, Bot, CheckCircle2, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";

type AdminBotState = {
  enabled: boolean;
  configured: boolean;
  chatId: string;
  events: Array<{ id: string; eventType: string; outcome: string; message: string; createdAt: string }>;
  health: Array<{ customerId: string; status: string; statusMessage: string | null; lastHeartbeatAt: string }>;
};

const EMPTY: AdminBotState = { enabled: false, configured: false, chatId: "", events: [], health: [] };

export function AdminBotPanel() {
  const [state, setState] = useState<AdminBotState>(EMPTY);
  const [botToken, setBotToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-bot/settings", { cache: "no-store" });
      const payload = await response.json() as AdminBotState & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Admin Bot məlumatları açıla bilmədi.");
      setState(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Admin Bot məlumatları açıla bilmədi.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    setSaving(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/admin-bot/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: state.enabled, botToken, chatId: state.chatId }),
      });
      const payload = await response.json() as { error?: string; enabled?: boolean; configured?: boolean; chatId?: string };
      if (!response.ok) throw new Error(payload.error || "Admin Bot saxlanmadı.");
      setBotToken("");
      setState((current) => ({ ...current, enabled: Boolean(payload.enabled), configured: true, chatId: payload.chatId || current.chatId }));
      setResult("Admin Bot məlumatları şifrəli seyfdə saxlanıldı.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Admin Bot saxlanmadı.");
    } finally { setSaving(false); }
  }

  async function test() {
    setTesting(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/admin-bot/test", { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Test mesajı göndərilmədi.");
      setResult("Test mesajı HEAT Admin Bot-a göndərildi.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Test mesajı göndərilmədi.");
    } finally { setTesting(false); }
  }

  const healthy = state.health.filter((item) => item.status === "healthy").length;
  const problems = state.health.filter((item) => item.status !== "healthy").length;

  return <section className="admin-bot-card" id="admin-bot">
    <div className="admin-bot-head">
      <div className="admin-bot-icon"><Bot size={22} /></div>
      <div><span className="admin-kicker">MƏRKƏZİ NƏZARƏT</span><h2>HEAT Admin Bot</h2><p>Bütün müştəri sistemlərinin problemlərini və avtomatik report nəticələrini yalnız sizə göndərir.</p></div>
      <div className={`admin-bot-state ${state.enabled && state.configured ? "active" : ""}`}><i />{state.enabled && state.configured ? "Aktivdir" : "Qurulmayıb"}</div>
    </div>

    {loading ? <div className="admin-bot-loading"><Loader2 className="spin" size={18} /> Məlumatlar açılır</div> : <>
      <div className="admin-bot-grid">
        <label className="admin-field"><span>Admin Bot tokeni</span><input type="password" value={botToken} onChange={(event) => setBotToken(event.target.value)} placeholder={state.configured ? "Dəyişmək üçün yeni token yazın" : "BotFather tokenini daxil edin"} autoComplete="off" /><small>Token heç vaxt panelə geri göstərilmir.</small></label>
        <label className="admin-field"><span>Sizin Telegram Chat ID</span><input type="text" inputMode="numeric" value={state.chatId} onChange={(event) => setState((current) => ({ ...current, chatId: event.target.value }))} placeholder="7048446801" /></label>
        <label className="admin-bot-switch"><input type="checkbox" checked={state.enabled} onChange={(event) => setState((current) => ({ ...current, enabled: event.target.checked }))} /><i /><span>Admin bildirişlərini aktiv et</span></label>
      </div>
      <div className="admin-bot-actions">
        <button type="button" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin" size={15} /> : <ShieldCheck size={15} />} Təhlükəsiz saxla</button>
        <button type="button" className="secondary" onClick={test} disabled={testing || !state.configured || !state.enabled}>{testing ? <Loader2 className="spin" size={15} /> : <Send size={15} />} Test mesajı göndər</button>
        <button type="button" className="ghost" onClick={load}><RefreshCw size={15} /> Yenilə</button>
      </div>
      {result && <div className="admin-bot-result success"><CheckCircle2 size={15} /> {result}</div>}
      {error && <div className="admin-bot-result error"><BellRing size={15} /> {error}</div>}

      <div className="admin-bot-summary">
        <div><span>Nəzarətdə olan sistemlər</span><b>{state.health.length}</b></div>
        <div><span>Sağlam</span><b>{healthy}</b></div>
        <div><span>Problem</span><b>{problems}</b></div>
        <div><span>Son hadisələr</span><b>{state.events.length}</b></div>
      </div>
      {state.events.length > 0 && <div className="admin-bot-events"><h3>Son Admin Bot hadisələri</h3>{state.events.map((event) => <div key={event.id}><i className={event.outcome} /><p>{event.message.split("\n")[0]}<small>{new Date(event.createdAt).toLocaleString("az-AZ")}</small></p><span>{event.outcome === "delivered" ? "Göndərildi" : event.outcome === "failed" ? "Xəta" : "Gözləyir"}</span></div>)}</div>}
    </>}
  </section>;
}

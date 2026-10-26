import { useEffect, useState } from "react";
import { BellRing, Bot, CheckCircle2, ChevronDown, ChevronUp, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";

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
  const [testing, setTesting] = useState<"problem" | "health" | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin-bot/settings", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as AdminBotState & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Admin Bot məlumatları açıla bilmədi.");
        setState(payload);
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Admin Bot məlumatları açıla bilmədi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    const checkHash = () => {
      if (window.location.hash === "#admin-bot" || window.location.hash === "#admin-bot-events") {
        setExpanded(true);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => {
      controller.abort();
      window.removeEventListener("hashchange", checkHash);
    };
  }, []);

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

  async function test(scenario: "problem" | "health") {
    setTesting(scenario); setError(""); setResult("");
    try {
      const response = await fetch("/api/admin-bot/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Test mesajı göndərilmədi.");
      setResult(scenario === "health" ? "Ümumi durum analizi testi HEAT Admin Bot-a göndərildi." : "Demo problem xəbərdarlığı HEAT Admin Bot-a göndərildi.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Test mesajı göndərilmədi.");
    } finally { setTesting(null); }
  }

  const healthy = state.health.filter((item) => item.status === "healthy").length;
  const problems = state.health.filter((item) => item.status !== "healthy").length;

  return (
    <section className={`admin-bot-card ${expanded ? "expanded" : "collapsed"}`} id="admin-bot">
      <div
        className="admin-bot-head"
        role="button"
        tabIndex={0}
        onClick={() => !expanded && setExpanded(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!expanded) setExpanded(true);
          }
        }}
      >
        <div className="admin-bot-icon"><Bot size={20} /></div>
        <div className="admin-bot-title-wrap">
          <div className="admin-bot-title-line">
            <span className="admin-kicker">MƏRKƏZİ NƏZARƏT</span>
            <h2>HEAT Admin Bot & Hadisələr</h2>
            <div className={`admin-bot-state ${state.enabled && state.configured ? "active" : ""}`}>
              <i />
              {state.enabled && state.configured ? "Aktivdir" : "Qurulmayıb"}
            </div>
          </div>
          <p>Bütün müştəri sistemlərinin kritik hadisələri, avtomatik status hesabatları və problemlər.</p>
        </div>

        <div className="admin-bot-compact-badges">
          <span className="admin-bot-badge"><b>{state.health.length}</b> sistem</span>
          <span className={`admin-bot-badge ${problems > 0 ? "warn" : ""}`}><b>{problems}</b> problem</span>
          <span className="admin-bot-badge"><b>{state.events.length}</b> hadisə</span>
          <button
            type="button"
            className="admin-bot-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            aria-expanded={expanded}
          >
            {expanded ? <><span>Gizlət</span> <ChevronUp size={14} /></> : <><span>Hadisələr & Tənzimləmələr</span> <ChevronDown size={14} /></>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="admin-bot-expanded-body">
          {loading ? (
            <div className="admin-bot-loading"><Loader2 className="spin" size={18} /> Məlumatlar açılır</div>
          ) : (
            <>
              <div className="admin-bot-grid">
                <label className="admin-field">
                  <span>Admin Bot tokeni</span>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(event) => setBotToken(event.target.value)}
                    placeholder={state.configured ? "Dəyişmək üçün yeni token yazın" : "BotFather tokenini daxil edin"}
                    autoComplete="off"
                  />
                  <small>Token heç vaxt panelə geri göstərilmir.</small>
                </label>
                <label className="admin-field">
                  <span>Sizin Telegram Chat ID</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={state.chatId}
                    onChange={(event) => setState((current) => ({ ...current, chatId: event.target.value }))}
                    placeholder="7048446801"
                  />
                </label>
                <label className="admin-bot-switch">
                  <input
                    type="checkbox"
                    checked={state.enabled}
                    onChange={(event) => setState((current) => ({ ...current, enabled: event.target.checked }))}
                  />
                  <i />
                  <span>Admin bildirişlərini aktiv et</span>
                </label>
              </div>

              <div className="admin-bot-actions">
                <button type="button" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="spin" size={15} /> : <ShieldCheck size={15} />} Təhlükəsiz saxla
                </button>
                <button type="button" className="secondary" onClick={() => test("health")} disabled={Boolean(testing) || !state.configured || !state.enabled}>
                  {testing === "health" ? <Loader2 className="spin" size={15} /> : <ShieldCheck size={15} />} Durum analizi testi
                </button>
                <button type="button" className="secondary" onClick={() => test("problem")} disabled={Boolean(testing) || !state.configured || !state.enabled}>
                  {testing === "problem" ? <Loader2 className="spin" size={15} /> : <Send size={15} />} Problem testini göndər
                </button>
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

              {state.health.length > 0 && (
                <div className="admin-bot-health">
                  <h3>Nəzarətdə olan sistemlər</h3>
                  {state.health.map((item) => (
                    <div key={item.customerId}>
                      <i className={item.status} />
                      <p>
                        {item.customerId === "demo-caspian-coffee" ? "Caspian Coffee · DEMO" : item.customerId}
                        <small>{item.statusMessage || "Status məlumatı qəbul edildi."}</small>
                      </p>
                      <span>{item.status === "healthy" ? "Sağlam" : "Problem"}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-bot-events" id="admin-bot-events">
                <h3>Son Admin Bot hadisələri</h3>
                {state.events.length === 0 ? (
                  <p className="admin-bot-empty-events">Hələlik qeydə alınmış hadisə yoxdur.</p>
                ) : (
                  state.events.map((event) => (
                    <div key={event.id}>
                      <i className={event.outcome} />
                      <p>
                        {event.message.split("\n")[0]}
                        <small>{new Date(event.createdAt).toLocaleString("az-AZ")}</small>
                      </p>
                      <span>{event.outcome === "delivered" ? "Göndərildi" : event.outcome === "failed" ? "Xəta" : "Gözləyir"}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

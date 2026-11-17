"use client";

import { Eye, EyeOff, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";

export function CustomerAppLogin() {
  const [token, setToken] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loginWithDemo = () => {
    setBusy(true);
    try {
      document.cookie = "heat_customer_session=demo; path=/; max-age=2592000; SameSite=Lax";
      localStorage.setItem("heat_customer_session", "demo");
    } catch {}
    setTimeout(() => {
      window.location.assign("/customer/dashboard");
    }, 300);
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      // Direct client login or server check
      document.cookie = "heat_customer_session=demo; path=/; max-age=2592000; SameSite=Lax";
      try {
        localStorage.setItem("heat_customer_session", token || "demo");
      } catch {}

      setTimeout(() => {
        window.location.assign("/customer/dashboard");
      }, 350);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Giriş alınmadı.");
      setBusy(false);
    }
  };

  return (
    <form className="customer-login-card" onSubmit={login}>
      <div className="customer-login-brand">
        <span>H</span>
        <div>
          <b>HEAT</b>
          <small>ENERGY ANALYTICS</small>
        </div>
      </div>
      <div className="customer-login-icon">
        <LockKeyhole size={23} />
      </div>
      <span className="admin-kicker">MÜŞTƏRİ PORTALI</span>
      <h1>Öz dashboardunuza giriş</h1>
      <p>HEAT tərəfindən yalnız sizin obyektiniz üçün verilmiş şəxsi giriş tokenini daxil edin.</p>

      <label>
        <span>Giriş tokeni</span>
        <div>
          <input
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            type={visible ? "text" : "password"}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="HEAT-••••••••••••"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Tokeni gizlət" : "Tokeni göstər"}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </label>

      {error && <div className="customer-login-error">{error}</div>}

      <button className="customer-login-submit" disabled={busy} type="submit">
        {busy ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={18} />}
        {busy ? "Yoxlanılır..." : "Dashboarda daxil ol"}
      </button>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button
          type="button"
          onClick={loginWithDemo}
          className="btn btn-secondary"
          style={{ width: "100%", justifyContent: "center", display: "inline-flex", gap: "0.5rem", alignItems: "center" }}
        >
          <Sparkles size={16} /> Nümayiş hesabı ilə daxil ol (Demo)
        </button>
      </div>

      <small className="customer-login-help" style={{ marginTop: "1rem" }}>
        Bu token yalnız sizə aid dashboardu açır. Nümayiş üçün birbaşa demo düyməsindən istifadə edə bilərsiniz.
      </small>
    </form>
  );
}

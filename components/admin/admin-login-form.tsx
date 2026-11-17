"use client";

import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";

export function AdminLoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    setTimeout(() => {
      // Standard default admin password or custom password
      if (password === "heat2026" || password === "admin" || password === "Heat2026!") {
        document.cookie = `heat_admin_session=heat2026; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        try {
          localStorage.setItem("heat_admin_session", "true");
        } catch {
          // localStorage fallback
        }
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      } else {
        setError("Daxil edilmiş şifrə düzgün deyil. Yenidən cəhd edin.");
        setBusy(false);
      }
    }, 400);
  };

  return (
    <main className="customer-login-page">
      <form className="customer-login-card" onSubmit={handleSubmit}>
        <div className="customer-login-brand">
          <span>H</span>
          <div>
            <b>HEAT</b>
            <small>CONTROL PLANE</small>
          </div>
        </div>
        <div className="customer-login-icon">
          <KeyRound size={24} />
        </div>
        <span className="admin-kicker">ADMINISTRATOR GİRİŞİ</span>
        <h1>Control Plane İdarəetməsi</h1>
        <p>HEAT sistemini, müştəri monitorinqini və sorğuları idarə etmək üçün admin şifrənizi daxil edin.</p>

        <label>
          <span>Admin şifrəsi</span>
          <div>
            <input
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              type={visible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Şifrəni gizlət" : "Şifrəni göstər"}
            >
              {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        {error && <div className="customer-login-error">{error}</div>}

        <button className="customer-login-submit" disabled={busy} type="submit">
          {busy ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={18} />}
          {busy ? "Yoxlanılır..." : "Paneli aç"}
        </button>

        <small className="customer-login-help">
          Bu panel yalnız HEAT idarə heyəti üçündür. İlkin şifrə: <b>heat2026</b>
        </small>
      </form>
    </main>
  );
}

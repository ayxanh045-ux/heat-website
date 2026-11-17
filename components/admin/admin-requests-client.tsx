"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Mail, Phone, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

type RequestItem = {
  id?: string;
  name?: string;
  fullName?: string;
  company?: string;
  companyName?: string;
  businessType?: string;
  phone?: string;
  email?: string;
  locations?: string;
  locationCount?: number | string;
  cost?: string;
  monthlyElectricityCost?: string;
  message?: string;
  timestamp?: string;
  createdAt?: string;
};

export function AdminRequestsClient({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [checking, setChecking] = useState(true);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    try {
      const hasCookie = document.cookie.includes("heat_admin_session=heat2026");
      const hasLocal = localStorage.getItem("heat_admin_session") === "true";
      if (hasCookie || hasLocal) {
        setLoggedIn(true);
      }
      loadRequests();
    } catch {
      // browser check
    } finally {
      setChecking(false);
    }
  }, []);

  const loadRequests = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("heat_leads") || "[]") as RequestItem[];
      setRequests(stored.reverse());
    } catch {
      setRequests([]);
    }
  };

  if (!loggedIn && !checking) {
    return <AdminLoginForm onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <main className="customer-edit-page" style={{ maxWidth: 1100, margin: "2rem auto", padding: "1rem" }}>
      <Link className="admin-bot-quick-link" href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem" }}>
        <ArrowLeft size={16} /> Admin panelinə qayıt
      </Link>

      <header style={{ marginBottom: "2rem" }}>
        <span className="admin-kicker">ENERJİ QİYMƏTLƏNDİRMƏSİ</span>
        <h1>Sorğular və Müraciətlər</h1>
        <p>Saytın əlaqə formasından göndərilmiş müraciətlər və Telegram bildirişləri.</p>
      </header>

      <section className="customer-list-card">
        <div className="customer-list-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2>Son Müraciətlər</h2>
            <p>Müştərilərin doldurduğu qiymətləndirmə formaları</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span className="admin-bot-quick-link">
              <ClipboardList size={15} /> {requests.length} sorğu
            </span>
            <button
              type="button"
              onClick={loadRequests}
              className="admin-bot-quick-link"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", color: "inherit" }}
            >
              <RefreshCw size={14} /> Yenilə
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="admin-empty" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <ClipboardList size={32} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
            <b style={{ display: "block" }}>Hələlik yeni sorğu qeydə alınmayıb</b>
            <span style={{ color: "#a1a1aa", fontSize: "0.875rem" }}>
              Müştərilər saytın əlaqə formasını doldurduqda müraciətlər dərhal həm bura, həm də Telegram @Heatadminbot-a göndərilir.
            </span>
          </div>
        ) : (
          <div className="customer-table-wrap" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Tarix</th>
                  <th>Ad / Şirkət</th>
                  <th>Fəaliyyət</th>
                  <th>Əlaqə</th>
                  <th>Obyekt / Xərc</th>
                  <th>Mesaj</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item, index) => {
                  const name = item.name || item.fullName || "Ad qeyd olunmayıb";
                  const company = item.company || item.companyName || "—";
                  const dateStr = item.timestamp
                    ? new Date(item.timestamp).toLocaleString("az-AZ", { timeZone: "Asia/Baku" })
                    : "Bu gün";
                  return (
                    <tr key={index}>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem", color: "#a1a1aa" }}>{dateStr}</td>
                      <td>
                        <b>{name}</b>
                        <span style={{ display: "block", color: "#a1a1aa", fontSize: "0.85rem" }}>{company}</span>
                      </td>
                      <td>{item.businessType || "—"}</td>
                      <td>
                        {item.phone && (
                          <a href={`tel:${item.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, color: "#60a5fa" }}>
                            <Phone size={13} /> {item.phone}
                          </a>
                        )}
                        {item.email && (
                          <a href={`mailto:${item.email}`} style={{ display: "flex", alignItems: "center", gap: 4, color: "#a1a1aa", fontSize: "0.85rem" }}>
                            <Mail size={13} /> {item.email}
                          </a>
                        )}
                      </td>
                      <td>
                        <span>Obyekt: {item.locations || item.locationCount || "1"}</span>
                        <span style={{ display: "block", color: "#eab308", fontSize: "0.85rem" }}>
                          {item.cost || item.monthlyElectricityCost || "Göstərilməyib"}
                        </span>
                      </td>
                      <td style={{ maxWidth: 260 }}>{item.message || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

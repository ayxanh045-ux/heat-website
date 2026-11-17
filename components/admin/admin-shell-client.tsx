"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, ClipboardList, ExternalLink, LogOut, Pencil, RefreshCw, Server, Users } from "lucide-react";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminBotPanel } from "@/components/admin/admin-bot-panel";
import { ProvisioningForm } from "@/components/admin/provisioning-form";
import { AdminPwaInstall } from "@/components/admin/admin-pwa-install";
import { DEMO_CUSTOMER } from "@/lib/demo-customer";

export function AdminShellClient({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const hasCookie = document.cookie.includes("heat_admin_session=heat2026");
      const hasLocal = localStorage.getItem("heat_admin_session") === "true";
      if (hasCookie || hasLocal) {
        setLoggedIn(true);
      }
    } catch {
      // browser check
    } finally {
      setChecking(false);
    }
  }, []);

  const handleLogout = () => {
    try {
      document.cookie = "heat_admin_session=; path=/; max-age=0";
      localStorage.removeItem("heat_admin_session");
    } catch {}
    setLoggedIn(false);
    window.location.reload();
  };

  if (!loggedIn && !checking) {
    return <AdminLoginForm onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          <span>H</span>
          <div>
            <b>HEAT</b>
            <small>CONTROL PLANE</small>
          </div>
        </Link>
        <nav>
          <a className="active" href="/admin">
            <Activity size={17} /> Provisioning
          </a>
          <a href="/admin/requests">
            <ClipboardList size={17} /> Qiymətləndirmə sorğuları
          </a>
          <a href="#customers">
            <Users size={17} /> Müştərilər
          </a>
          <a href="#admin-bot">
            <Bot size={17} /> Admin Bot
          </a>
          <a href="/customer/dashboard" target="_blank" rel="noreferrer">
            <ExternalLink size={17} /> Canlı Dashboard
          </a>
        </nav>
        <AdminPwaInstall />
        <div className="admin-user">
          <span>A</span>
          <div>
            <b>Administrator</b>
            <small>admin@heatenergyanalytics.com</small>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Çıxış"
            style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header>
          <div>
            <span className="admin-kicker">MULTI-TENANT ONBOARDING</span>
            <h1>Sistem idarəetməsi</h1>
            <p>Məlumatları daxil edin — provisioner ayrıca və izolə edilmiş enerji monitorinq sistemi qursun.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-bot-quick-link" href="/admin/requests">
              <ClipboardList size={15} />
              <span>Gələn sorğular</span>
            </a>
            <a className="admin-bot-quick-link" href="#admin-bot">
              <Bot size={15} />
              <span>Admin Bot Hadisələri</span>
            </a>
            <div className="agent-state">
              <i />
              <span>Provisioner agent</span>
              <b>Hazırdır</b>
            </div>
          </div>
        </header>

        <AdminBotPanel />

        <section id="customers">
          <div className="customer-list-card">
            <div className="customer-list-head">
              <div>
                <h2>Müştəri sistemləri</h2>
                <p>Hər müştərinin tokeni və dashboardu ayrıdır. Siz admin kimi hamısına baxa bilərsiniz.</p>
              </div>
              <a href="/admin">
                <RefreshCw size={15} /> Yenilə
              </a>
            </div>

            <div className="customer-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Müştəri</th>
                    <th>Cihaz</th>
                    <th>Rejim</th>
                    <th>Status</th>
                    <th>Canlı baxış</th>
                    <th>Sil</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="demo-customer-row">
                    <td>
                      <a className="customer-name-link" href="/customer/dashboard" target="_blank" rel="noreferrer">
                        <b>{DEMO_CUSTOMER.customerName}</b>
                        <span>{DEMO_CUSTOMER.siteName}</span>
                      </a>
                    </td>
                    <td>
                      <code>{DEMO_CUSTOMER.deviceId}</code>
                      <span>{DEMO_CUSTOMER.deviceName}</span>
                    </td>
                    <td>Gündəlik demo</td>
                    <td>
                      <i className="status-pill demo">Demo aktivdir</i>
                    </td>
                    <td>
                      <a className="grafana-link" href="/customer/dashboard" target="_blank" rel="noreferrer">
                        <ExternalLink size={14} /> Dashboarda bax
                      </a>
                    </td>
                    <td>Qorunur</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <ProvisioningForm />
      </main>
    </div>
  );
}

"use client";

import { LogOut } from "lucide-react";

export function CustomerAppShell({ customerName }: { customerName: string }) {
  const logout = async () => { await fetch("/api/customer-auth/logout", { method: "POST" }); window.location.assign("/app"); };
  return <header className="customer-app-bar"><a href="/app/dashboard"><span>H</span><b>HEAT</b></a><small>{customerName}</small><button type="button" onClick={logout} aria-label="Çıxış"><LogOut size={17} /></button></header>;
}

"use client";
import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const tick = () => fetch("/api/telegram/scheduled-reports", { method: "POST", cache: "no-store" }).catch(() => undefined);
    tick();
    const interval = window.setInterval(tick, 15_000);
    return () => window.clearInterval(interval);
  }, []);
  return null;
}

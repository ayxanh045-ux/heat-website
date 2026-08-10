"use client";

import { Download, MonitorSmartphone } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AdminPwaInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    navigator.serviceWorker?.register("/admin-sw.js", { scope: "/admin/" }).catch(() => undefined);
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const done = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  const install = async () => {
    if (!prompt) { setHelp(current => !current); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  return <div className="admin-pwa-install">
    <button type="button" onClick={install} disabled={installed}>
      {installed ? <MonitorSmartphone size={16} /> : <Download size={16} />}
      <span><b>{installed ? "Admin tətbiqi açıqdır" : "Admin tətbiqini quraşdır"}</b><small>{installed ? "Ayrıca app rejimində" : "Bu cihazda ayrıca aç"}</small></span>
    </button>
    {help && !installed && <p>Safari: paylaş düyməsinə basın və “Add to Home Screen” seçin. Chrome: ünvan sətrindəki quraşdırma işarəsinə basın.</p>}
  </div>;
}

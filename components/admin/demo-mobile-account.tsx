"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const DEMO_TOKEN = "HEAT-DEMO-CASPIAN-2026";

export function DemoMobileAccount() {
  const [visible, setVisible] = useState(false);
  return <button className="demo-mobile-account" type="button" onClick={() => setVisible(current => !current)} aria-expanded={visible}>
    <b>Mobil hesab aktivdir</b>
    <span>{visible ? <EyeOff size={12} /> : <Eye size={12} />}<code>{visible ? DEMO_TOKEN : "••••••••••••••••••••••"}</code></span>
  </button>;
}

"use client";

import { Globe2 } from "lucide-react";
import { useLanguage, type Language } from "@/components/i18n";

export function PortalLanguageSelect() {
  const { language, setLanguage } = useLanguage();
  return <label className="portal-language-select" aria-label="Select language">
    <Globe2 size={14} />
    <select value={language} onChange={event => setLanguage(event.target.value as Language)}>
      <option value="az">AZ</option><option value="en">EN</option><option value="ru">RU</option>
    </select>
  </label>;
}

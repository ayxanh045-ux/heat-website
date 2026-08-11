import { LanguageProvider } from "@/components/i18n";
import { PortalLanguageSelect } from "@/components/portal-language-select";

export default function CustomerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <LanguageProvider><div id="customer-portal"><PortalLanguageSelect />{children}</div></LanguageProvider>;
}

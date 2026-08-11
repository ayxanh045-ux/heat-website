import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n";
import { PortalLanguageSelect } from "@/components/portal-language-select";

export const metadata: Metadata = {
  title: "HEAT Admin | Control Panel",
  description: "HEAT administratoru üçün təhlükəsiz idarəetmə paneli.",
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "HEAT Admin" },
  icons: { apple: "/app-icon-192.png" },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <LanguageProvider><div id="admin-portal"><PortalLanguageSelect />{children}</div></LanguageProvider>;
}

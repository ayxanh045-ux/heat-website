import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { SeoSchema } from "@/components/seo-schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://heatenergyanalytics.com"),
  title: "HEAT | Ağıllı enerji monitorinqi və analitikası",
  description:
    "HEAT — Azərbaycanda restoran, hotel, ofis və ticarət obyektləri üçün real vaxtda 3-fazalı elektrik monitorinqi, süni intellekt analitikası və Telegram hesabatları ilə 15–25%-dək qənaət təmin edən ağıllı enerji platformasıdır.",
  keywords: [
    "enerji monitorinqi",
    "enerji analitikası",
    "elektrik istehlakının izlənməsi",
    "biznes üçün enerji idarəetməsi",
    "enerji xərclərinin azaldılması",
    "enerji israfının aşkarlanması",
    "restoran elektrik qənaəti",
    "otel enerji monitorinqi",
    "3 faza monitorinq",
    "Shelly Pro 3EM Azərbaycan",
    "Telegram enerji botu",
    "süni intellekt enerji analizi",
    "Azərbaycan",
    "Bakı",
    "energy monitoring Baku",
    "energy analytics Azerbaijan",
    "electricity monitoring for business",
    "business energy management",
    "HEAT Energy Analytics",
  ],
  authors: [{ name: "HEAT — Hasanov Energy & Technology", url: "https://heatenergyanalytics.com" }],
  creator: "HEAT Energy Analytics",
  publisher: "HEAT Energy & Technology",
  category: "Energy Management & Analytics",
  openGraph: {
    url: "https://heatenergyanalytics.com/",
    title: "HEAT | Ağıllı enerji monitorinqi və analitikası",
    description:
      "Enerjini görün. İsrafı dayandırın. Bizneslər üçün real vaxtda 3-fazalı elektrik analitikası və Telegram hesabatları.",
    type: "website",
    siteName: "HEAT — Hasanov Energy & Technology",
    locale: "az_AZ",
    alternateLocale: ["en_US", "ru_RU"],
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "HEAT ağıllı enerji analitikası idarəetmə paneli",
      },
    ],
  },
  alternates: {
    canonical: "https://heatenergyanalytics.com/",
    languages: {
      "az-AZ": "https://heatenergyanalytics.com/",
      "en-US": "https://heatenergyanalytics.com/",
      "ru-RU": "https://heatenergyanalytics.com/",
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "HEAT | Ağıllı enerji monitorinqi və analitikası",
    description:
      "Enerjini görün. İsrafı dayandırın. Bizneslər üçün real vaxt enerji analitikası.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/app-icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "HEAT" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="dark">
      <head>
        <SeoSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

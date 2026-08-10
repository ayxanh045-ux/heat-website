import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

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
    "HEAT bizneslərə elektrik istehlakını real vaxtda izləməyə, enerji israfını aşkarlamağa və enerji xərclərini anlamağa kömək edir.",
  keywords: [
    "enerji monitorinqi",
    "enerji analitikası",
    "elektrik istehlakının izlənməsi",
    "biznes üçün enerji idarəetməsi",
    "enerji xərclərinin azaldılması",
    "enerji israfının aşkarlanması",
    "Azərbaycan",
    "Bakı",
    "energy monitoring",
    "energy analytics",
    "electricity monitoring",
    "business energy management",
    "energy optimization",
    "HEAT Energy Analytics",
  ],
  openGraph: {
    url: "https://heatenergyanalytics.com/",
    title: "HEAT | Ağıllı enerji monitorinqi və analitikası",
    description:
      "Enerjini görün. İsrafı dayandırın. Bizneslər üçün real vaxt enerji analitikası.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "HEAT ağıllı enerji analitikası idarəetmə paneli",
      },
    ],
  },
  alternates: { canonical: "https://heatenergyanalytics.com/" },
  twitter: {
    card: "summary_large_image",
    title: "HEAT | Ağıllı enerji monitorinqi və analitikası",
    description:
      "Enerjini görün. İsrafı dayandırın. Bizneslər üçün real vaxt enerji analitikası.",
    images: ["/og.png"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegister />{children}
      </body>
    </html>
  );
}

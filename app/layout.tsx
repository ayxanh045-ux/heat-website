import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HEAT | Intelligent Energy Monitoring & Analytics",
  description:
    "HEAT bizneslərə elektrik istehlakını real vaxtda izləməyə, enerji israfını aşkarlamağa və enerji xərclərini anlamağa kömək edir.",
  keywords: [
    "energy monitoring",
    "energy analytics",
    "electricity monitoring",
    "business energy management",
    "energy optimization",
    "Baku",
    "Azerbaijan",
    "HEAT Energy Analytics",
  ],
  openGraph: {
    title: "HEAT | Intelligent Energy Monitoring & Analytics",
    description:
      "Enerjini görün. İsrafı dayandırın. Bizneslər üçün real vaxt enerji analitikası.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "HEAT intelligent energy analytics dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HEAT | Intelligent Energy Monitoring & Analytics",
    description:
      "See Energy. Stop Waste. Real-time electricity visibility for businesses.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
        {children}
      </body>
    </html>
  );
}

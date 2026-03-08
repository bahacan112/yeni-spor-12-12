import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Yeni Spor Okulu | Spor Akademisi ve Kulüp Yönetim Yazılımı",
    template: "%s | Yeni Spor Okulu",
  },
  description: "Spor okulları, yüzme kursları, basketbol akademileri ve stüdyolar için öğrenci kayıt, tahsilat, yoklama, antrenman planlama ve şube yönetim sistemi.",
  keywords: [
    "spor okulu yazılımı",
    "spor kulübü programı",
    "aidat takip sistemi",
    "yoklama programı",
    "kulüp yönetim sistemi",
    "antrenman programı",
    "spor akademisi uygulaması",
    "şube yönetim sistemi",
  ],
  authors: [{ name: "Yeni Spor Okulu Yazılımı" }],
  creator: "Yeni Spor Okulu",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://yenisporokulu.com", // Replace with real URL when available
    title: "Yeni Spor Okulu | Spor Akademisi Yönetim Yazılımı",
    description: "Öğrenci kaydı, aidat takibi, şube yönetimi ve online kayıt linkleri ile spor okulunuzu dijitalleştirin ve profesyonelce yönetin.",
    siteName: "Yeni Spor Okulu",
    images: [
      {
        url: "/modern-dark-dashboard-ui-for-sports-academy-manage.jpg", // The dashboard preview or logo works here
        width: 1200,
        height: 630,
        alt: "Spor Okulu Yönetim Ekranı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yeni Spor Okulu | Spor Akademisi Yönetim Yazılımı",
    description: "Spor okulları, kulüpler ve akademiler için hepsi bir arada yönetim platformu.",
    images: ["/modern-dark-dashboard-ui-for-sports-academy-manage.jpg"],
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
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1d2e",
  viewportFit: "cover",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HashRedirect from "@/components/HashRedirect";
import RateLimitNotice from "@/components/RateLimitNotice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "QR Kan - Digital Profile Builder",
    template: "%s | QR Kan",
  },
  description: "Buat profil digital Anda dengan QR code. Platform bio link terbaik untuk mengelola semua konten Anda dalam satu tempat.",
  keywords: ["bio link", "qr code", "digital profile", "link in bio", "indonesia"],
  authors: [{ name: "QR Kan" }],
  creator: "QR Kan",
  publisher: "QR Kan",
  metadataBase: new URL("https://qrkan.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://qrkan.com",
    siteName: "QR Kan",
    title: "QR Kan - Digital Profile Builder",
    description: "Platform bio link terbaik untuk mengelola semua konten Anda dalam satu tempat",
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
    icon: "/default-logo.svg",
    shortcut: "/default-logo.svg",
    apple: "/default-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <HashRedirect />
        <RateLimitNotice />
        {children}
      </body>
    </html>
  );
}

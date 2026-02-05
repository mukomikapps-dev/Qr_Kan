import HomePageClient from "./HomePageClient";
import OAuthCallbackHandler from "./OAuthCallbackHandler";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "/default-logo.svg",
    shortcut: "/default-logo.svg",
    apple: "/default-logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://qrkan.com",
    siteName: "QR Kan",
    title: "QR Kan - Digital Profile Builder",
    description: "Platform bio link terbaik untuk mengelola semua konten Anda dalam satu tempat",
  },
};

// Force static generation - no auth, no server-side operations
export const dynamic = 'force-static';
export const revalidate = false;

export default function HomePage() {
	// Completely static page - no auth check, no server operations
	return (
		<>
			<Suspense fallback={null}>
				<OAuthCallbackHandler />
			</Suspense>
			<HomePageClient user={null} />
		</>
	);
}

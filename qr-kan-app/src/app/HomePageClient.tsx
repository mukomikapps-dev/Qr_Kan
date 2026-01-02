"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QrCodeIcon, LinkIcon, PaletteIcon, ChartIcon, ShieldIcon, MobileIcon, ArrowRightIcon, CheckIcon } from "@/components/SimpleIcons";

interface HomePageClientProps {
	user: { id: string } | null;
}

export default function HomePageClient({ user }: HomePageClientProps) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
			{/* Header/Nav */}
			<header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
				<div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<QrCodeIcon className="h-8 w-8 text-emerald-600" />
						<span className="text-2xl font-bold">QR Kan</span>
					</div>
					<nav className="hidden md:flex items-center gap-6">
						<Link href="/explore" className="text-zinc-600 hover:text-zinc-900 transition">
							Explore
						</Link>
						<a href="#fitur" className="text-zinc-600 hover:text-zinc-900 transition">
							Fitur
						</a>
						<a href="#pricing" className="text-zinc-600 hover:text-zinc-900 transition">
							Harga
						</a>
						{user ? (
							<Link
								href="/dashboard"
								className="rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 transition"
							>
								Dashboard
							</Link>
						) : (
							<>
								<Link
									href="/login"
									className="text-zinc-600 hover:text-zinc-900 transition"
								>
									Masuk
								</Link>
								<Link
									href="/register"
									className="rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 transition"
								>
									Daftar Gratis
								</Link>
							</>
						)}
					</nav>
					{/* Mobile Navigation */}
					<nav className="flex md:hidden items-center gap-3">
						<Link href="/explore" className="text-zinc-600 hover:text-zinc-900 transition text-sm font-medium">
							Explore
						</Link>
						{user ? (
							<Link
								href="/dashboard"
								className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition"
							>
								Dashboard
							</Link>
						) : (
							<Link
								href="/login"
								className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition"
							>
								Masuk
							</Link>
						)}
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="mx-auto max-w-7xl px-6 py-20 md:py-32">
				<div className="grid gap-12 md:grid-cols-2 items-center">
					<div>
						<div className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm text-emerald-700 mb-6">
							🚀 Platform Bio Link Terbaik di Indonesia
						</div>
						<h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
							Satu Link untuk{" "}
							<span className="text-emerald-600">Semua Konten</span> Anda
						</h1>
						<p className="text-xl text-zinc-600 mb-8 leading-relaxed">
							QR Kan adalah platform bio link yang memudahkan Anda mengelola semua link penting
							dalam satu halaman dengan QR code yang dapat disesuaikan.
						</p>
						<div className="flex flex-col sm:flex-row gap-4">
							<Link
								href={user ? "/dashboard" : "/register"}
								className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/30"
							>
								{user ? "Buka Dashboard" : "Mulai Gratis Sekarang"}
								<ArrowRightIcon className="w-4 h-4" />
							</Link>
							<a
								href="#fitur"
								className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-zinc-300 px-8 py-4 text-lg font-semibold text-zinc-900 hover:bg-zinc-50 transition"
							>
								Lihat Fitur
							</a>
						</div>
						<div className="mt-8 flex items-center gap-6 text-sm text-zinc-600">
							<div className="flex items-center gap-2">
								<CheckIcon className="text-emerald-600 w-3 h-3" />
								<span>Gratis selamanya</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckIcon className="text-emerald-600 w-3 h-3" />
								<span>Tanpa kartu kredit</span>
							</div>
						</div>
					</div>
					<div className="relative">
						<div className="rounded-2xl border-8 border-zinc-900 bg-white shadow-2xl overflow-hidden">
							<div className="bg-zinc-900 px-4 py-3 flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-red-500"></div>
								<div className="h-3 w-3 rounded-full bg-yellow-500"></div>
								<div className="h-3 w-3 rounded-full bg-green-500"></div>
							</div>
							<div className="p-8 bg-gradient-to-br from-emerald-50 to-white">
								<div className="text-center mb-6">
									<div className="inline-block rounded-full bg-white p-4 shadow-lg mb-4">
										<QrCodeIcon className="h-16 w-16 text-emerald-600" />
									</div>
									<h3 className="text-2xl font-bold">@username</h3>
									<p className="text-zinc-600">Bio Anda disini</p>
								</div>
								<div className="space-y-3">
									<div className="rounded-xl bg-emerald-600 px-6 py-4 text-center text-white font-medium shadow-md">
										🔗 Website Saya
									</div>
									<div className="rounded-xl bg-white px-6 py-4 text-center text-zinc-900 font-medium shadow-md border-2 border-zinc-200">
										📷 Instagram
									</div>
									<div className="rounded-xl bg-white px-6 py-4 text-center text-zinc-900 font-medium shadow-md border-2 border-zinc-200">
										🎵 TikTok
									</div>
								</div>
							</div>
						</div>
						<div className="absolute -top-4 -right-4 bg-yellow-400 rounded-lg px-4 py-2 font-semibold shadow-lg rotate-3">
							✨ Gratis!
						</div>
					</div>
				</div>
			</section>

			{/* Features Section - Lazy loaded */}
			<LazySection id="fitur" className="bg-white py-20">
				<div className="mx-auto max-w-7xl px-6">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Fitur <span className="text-emerald-600">Lengkap</span> untuk Anda
						</h2>
						<p className="text-xl text-zinc-600 max-w-2xl mx-auto">
							Semua yang Anda butuhkan untuk mengelola kehadiran online Anda dalam satu platform
						</p>
					</div>
					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						<FeatureCard
							icon={<QrCodeIcon className="h-6 w-6" />}
							title="QR Code Dinamis"
							description="Generate QR code otomatis untuk halaman Anda. Download dalam format SVG atau PNG."
						/>
						<FeatureCard
							icon={<LinkIcon className="h-6 w-6" />}
							title="Link Tanpa Batas"
							description="Tambahkan link, social media, video, gambar, WhatsApp, dan marketplace tanpa batasan."
						/>
						<FeatureCard
							icon={<PaletteIcon className="h-6 w-6" />}
							title="Template Tema"
							description="Pilih dari 6+ preset tema profesional atau customize sesuai brand Anda."
						/>
						<FeatureCard
							icon={<ChartIcon className="h-6 w-6" />}
							title="A/B Testing"
							description="Test berbagai versi link Anda untuk meningkatkan conversion rate hingga 50%."
						/>
						<FeatureCard
							icon={<ShieldIcon className="h-6 w-6" />}
							title="Analytics Real-time"
							description="Lacak visits, clicks, dan CTR dengan dashboard analytics yang powerful."
						/>
						<FeatureCard
							icon={<MobileIcon className="h-6 w-6" />}
							title="Mobile Friendly"
							description="Tampilan sempurna di semua device dengan drag-and-drop reorder yang mudah."
						/>
					</div>
				</div>
			</LazySection>

			{/* Stats Section */}
			<section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16 text-white">
				<div className="mx-auto max-w-7xl px-6">
					<div className="grid gap-8 md:grid-cols-3 text-center">
						<div>
							<div className="text-5xl font-bold mb-2">10K+</div>
							<div className="text-emerald-100">Pengguna Aktif</div>
						</div>
						<div>
							<div className="text-5xl font-bold mb-2">1M+</div>
							<div className="text-emerald-100">Total Klik</div>
						</div>
						<div>
							<div className="text-5xl font-bold mb-2">99.9%</div>
							<div className="text-emerald-100">Uptime</div>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section - Lazy loaded */}
			<LazySection id="pricing" className="py-20">
				<div className="mx-auto max-w-7xl px-6">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">
							Harga yang <span className="text-emerald-600">Transparan</span>
						</h2>
						<p className="text-xl text-zinc-600">
							Mulai gratis, upgrade kapan saja sesuai kebutuhan Anda
						</p>
					</div>
					<div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
						<PricingCard
							name="Free"
							price="Rp 0"
							period="/bulan"
							features={[
								"Link tanpa batas",
								"QR Code gratis",
								"Analytics dasar",
								"3 Template tema",
								"Drag & drop",
							]}
							cta="Mulai Gratis"
							highlighted={false}
						/>
						<PricingCard
							name="Pro"
							price="Rp 49.000"
							period="/bulan"
							features={[
								"Semua fitur Free",
								"A/B Testing",
								"6+ Template premium",
								"Custom domain",
								"Analytics advanced",
								"Priority support",
							]}
							cta="Upgrade ke Pro"
							highlighted={true}
						/>
						<PricingCard
							name="Business"
							price="Rp 199.000"
							period="/bulan"
							features={[
								"Semua fitur Pro",
								"Tim collaboration",
								"White label",
								"API access",
								"Custom integrations",
								"Dedicated support",
							]}
							cta="Hubungi Kami"
							highlighted={false}
						/>
					</div>
				</div>
			</LazySection>

			{/* CTA Section */}
			<section className="bg-gradient-to-br from-emerald-600 to-teal-600 py-20 text-white">
				<div className="mx-auto max-w-4xl px-6 text-center">
					<h2 className="text-4xl md:text-5xl font-bold mb-6">
						Siap Memulai Perjalanan Digital Anda?
					</h2>
					<p className="text-xl text-emerald-100 mb-8">
						Bergabung dengan ribuan creator, bisnis, dan influencer yang sudah menggunakan QR Kan
					</p>
					<Link
						href={user ? "/dashboard" : "/register"}
						className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-600 hover:bg-emerald-50 transition shadow-xl"
					>
						{user ? "Buka Dashboard" : "Buat Halaman Gratis"}
						<ArrowRightIcon className="w-4 h-4" />
					</Link>
				</div>
			</section>

			{/* Footer - Lazy loaded */}
			<LazySection className="border-t border-zinc-200 bg-white py-12">
				<div className="mx-auto max-w-7xl px-6">
					<div className="grid gap-8 md:grid-cols-4">
						<div>
							<div className="flex items-center gap-2 mb-4">
								<QrCodeIcon className="h-6 w-6 text-emerald-600" />
								<span className="text-xl font-bold">QR Kan</span>
							</div>
							<p className="text-sm text-zinc-600">
								Platform bio link terbaik untuk mengelola semua konten Anda dalam satu tempat.
							</p>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Produk</h3>
							<ul className="space-y-2 text-sm text-zinc-600">
								<li>
									<Link href="/explore" className="hover:text-zinc-900 transition">
										Explore
									</Link>
								</li>
								<li>
									<a href="#fitur" className="hover:text-zinc-900 transition">
										Fitur
									</a>
								</li>
								<li>
									<a href="#pricing" className="hover:text-zinc-900 transition">
										Harga
									</a>
								</li>
								<li>
									<Link href="/dashboard" className="hover:text-zinc-900 transition">
										Dashboard
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Perusahaan</h3>
							<ul className="space-y-2 text-sm text-zinc-600">
								<li>
									<a href="#" className="hover:text-zinc-900 transition">
										Tentang Kami
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-zinc-900 transition">
										Blog
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-zinc-900 transition">
										Kontak
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Legal</h3>
							<ul className="space-y-2 text-sm text-zinc-600">
								<li>
									<a href="#" className="hover:text-zinc-900 transition">
										Privasi
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-zinc-900 transition">
										Terms
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-zinc-200 mt-12 pt-8 text-center text-sm text-zinc-600">
						© 2025 QR Kan. All rights reserved.
					</div>
				</div>
			</LazySection>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-zinc-200 bg-white p-6 hover:shadow-xl transition">
			<div className="inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-600 mb-4">
				{icon}
			</div>
			<h3 className="text-xl font-semibold mb-2">{title}</h3>
			<p className="text-zinc-600">{description}</p>
		</div>
	);
}

function PricingCard({
	name,
	price,
	period,
	features,
	cta,
	highlighted,
}: {
	name: string;
	price: string;
	period: string;
	features: string[];
	cta: string;
	highlighted: boolean;
}) {
	return (
		<div
			className={`rounded-2xl p-8 ${
				highlighted
					? "border-2 border-emerald-600 bg-emerald-50 shadow-xl scale-105"
					: "border border-zinc-200 bg-white"
			}`}
		>
			{highlighted && (
				<div className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white mb-4">
					⭐ Paling Populer
				</div>
			)}
			<h3 className="text-2xl font-bold mb-2">{name}</h3>
			<div className="mb-6">
				<span className="text-4xl font-bold">{price}</span>
				<span className="text-zinc-600">{period}</span>
			</div>
			<ul className="space-y-3 mb-8">
				{features.map((feature, idx) => (
					<li key={idx} className="flex items-start gap-2">
						<CheckIcon className="text-emerald-600 w-3 h-3 mt-1 flex-shrink-0" />
						<span className="text-sm">{feature}</span>
					</li>
				))}
			</ul>
			<Link
				href="/register"
				className={`block rounded-full px-6 py-3 text-center font-semibold transition ${
					highlighted
						? "bg-emerald-600 text-white hover:bg-emerald-700"
						: "border-2 border-zinc-300 text-zinc-900 hover:bg-zinc-50"
				}`}
			>
				{cta}
			</Link>
		</div>
	);
}

// Lazy Section Component - Only renders when in viewport
function LazySection({ 
	id, 
	className = "", 
	children 
}: { 
	id?: string; 
	className?: string; 
	children: React.ReactNode;
}) {
	const [isVisible, setIsVisible] = useState(false);
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '100px' } // Start loading 100px before it's visible
		);

		const currentRef = ref.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, []);

	return (
		<section ref={ref} id={id} className={className}>
			{isVisible ? children : <div className="min-h-[400px]" />}
		</section>
	);
}



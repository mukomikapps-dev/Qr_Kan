import Link from "next/link";
import type { ReactNode } from "react";
import ProfileSwitcher from "@/components/ProfileSwitcher";

const NAV_ITEMS = [
	{
		href: "/dashboard",
		label: "Dashboard",
		d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
	},
	{
		href: "/dashboard/editor",
		label: "Editor",
		d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
	},
	{
		href: "/dashboard/profile",
		label: "Profile",
		d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
	},
	{
		href: "/dashboard/pages",
		label: "My Pages",
		d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z",
	},
];

export type HeaderProfile = {
	id: string;
	username: string;
	displayName: string;
};

export default function DashboardHeader({
	title,
	subtitle,
	username,
	profileList,
	activeProfileId,
	logout,
	children,
}: {
	title: string;
	subtitle?: string;
	username: string;
	profileList: HeaderProfile[];
	activeProfileId?: string | null;
	logout?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="mb-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
			{/* Row 1: logo + judul ... kanan: Subscription + Logout */}
			<div className="flex flex-nowrap items-center justify-between gap-3 p-4 sm:p-6 sm:pb-3">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-md">
						<img src="/default-logo.svg" alt="QR Kan Logo" className="h-full w-full object-contain" />
					</div>
					<div className="min-w-0">
						<h1 className="truncate text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h1>
						<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
							<Link
								href={`/@${username}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 font-medium text-emerald-600 transition hover:text-emerald-700 hover:underline"
							>
								@{username}
								<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							</Link>
							{subtitle && <span className="hidden truncate text-zinc-500 sm:inline">· {subtitle}</span>}
						</div>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{children}
					{logout}
				</div>
			</div>

			{/* Row 2: nav dalam 1 baris (tanpa overflow clip agar dropdown tidak terpotong) */}
			<div className="flex flex-nowrap items-center gap-2 border-t border-zinc-100 px-4 py-3 sm:px-6">
				<nav className="flex flex-nowrap items-center gap-1.5">
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors shadow-sm ${
								item.label === title
									? "border-emerald-300 bg-emerald-50 text-emerald-700"
									: "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
							}`}
						>
							<svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.d} />
							</svg>
							<span className="hidden sm:inline">{item.label}</span>
						</Link>
					))}
				</nav>

				<ProfileSwitcher
					profiles={profileList}
					activeProfileId={activeProfileId ?? null}
					iconOnly
					className="shrink-0"
				/>
			</div>
		</div>
	);
}

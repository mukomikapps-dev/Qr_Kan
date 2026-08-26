"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setActiveProfileAction } from "@/app/dashboard/serverActions";

export type SwitcherProfile = {
	id: string;
	username: string;
	displayName: string;
};

export default function ProfileSwitcher({
	profiles,
	activeProfileId,
	className = "",
}: {
	profiles: SwitcherProfile[];
	activeProfileId?: string | null;
	className?: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const ref = useRef<HTMLDivElement>(null);

	const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

	useEffect(() => {
		function onDocClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, []);

	if (!profiles.length) return null;

	const handleSelect = (id: string) => {
		if (id === active?.id) {
			setOpen(false);
			return;
		}
		setError(null);
		startTransition(async () => {
			const res = await setActiveProfileAction(id);
			if (res?.error) {
				setError(res.error);
			} else {
				setOpen(false);
				router.refresh();
			}
		});
	};

	return (
		<div ref={ref} className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
			>
				<span className="max-w-[140px] truncate text-emerald-600">@{active?.username}</span>
				<svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
					<div className="border-b border-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
						Pilih Profil
					</div>
					<ul className="max-h-72 overflow-y-auto py-1">
						{profiles.map((p) => {
							const isActive = p.id === active?.id;
							return (
								<li key={p.id}>
									<button
										type="button"
										onClick={() => handleSelect(p.id)}
										disabled={isPending}
										className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 transition-colors"
									>
										<span className="flex items-center gap-2 min-w-0">
											<span className={isActive ? "text-emerald-600 font-medium" : "text-zinc-700"}>
												@{p.username}
											</span>
											<span className="truncate text-xs text-zinc-400">{p.displayName}</span>
										</span>
										{isActive && (
											<svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										)}
									</button>
								</li>
							);
						})}
					</ul>
					<div className="border-t border-zinc-100 p-2">
						<Link
							href="/dashboard/pages"
							onClick={() => setOpen(false)}
							className="flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition-colors"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							Kelola Profil
						</Link>
					</div>
				</div>
			)}

			{error && <div className="absolute right-0 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
		</div>
	);
}
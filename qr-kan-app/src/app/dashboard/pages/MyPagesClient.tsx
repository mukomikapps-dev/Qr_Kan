"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	createProfileAction,
	setActiveProfileAction,
	deleteProfileAction,
	renameProfileAction,
} from "@/app/dashboard/serverActions";

export type PageProfile = {
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	createdAt: string;
};

type Notice = { type: "success" | "error"; text: string } | null;

export default function MyPagesClient({
	profiles,
	activeProfileId,
	isPro,
}: {
	profiles: PageProfile[];
	activeProfileId: string | null;
	isPro: boolean;
}) {
	const router = useRouter();
	const [notice, setNotice] = useState<Notice>(null);
	const [isPending, startTransition] = useTransition();
	const [showCreate, setShowCreate] = useState(false);
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");

	const canCreate = isPro || profiles.length === 0;

	function flash(text: string, type: "success" | "error" = "success") {
		setNotice({ type, text });
	}

	const createProfile = () => {
		if (!username.trim() || !displayName.trim()) {
			flash("Username dan display name wajib diisi", "error");
			return;
		}
		setNotice(null);
		startTransition(async () => {
			try {
				const newName = username.trim();
				await createProfileAction(newName, displayName);
				flash(`Profile @${newName} berhasil dibuat!`, "success");
				setShowCreate(false);
				setUsername("");
				setDisplayName("");
				router.push("/dashboard/editor");
				router.refresh();
			} catch (err) {
				flash(err instanceof Error ? err.message : "Gagal membuat profil", "error");
			}
		});
	};

	const setActive = (id: string, goEditor: boolean) => {
		setNotice(null);
		startTransition(async () => {
			const res = await setActiveProfileAction(id);
			if (res?.error) {
				flash(res.error, "error");
				return;
			}
			router.refresh();
			if (goEditor) router.push("/dashboard/editor");
		});
	};

	const remove = (id: string, username: string) => {
		if (!window.confirm(`Hapus profil @${username}? Semua data di halaman ini akan ikut terhapus.`)) return;
		setNotice(null);
		startTransition(async () => {
			const res = await deleteProfileAction(id);
			if (res?.error) {
				flash(res.error, "error");
				return;
			}
			flash("Profil dihapus", "success");
			router.refresh();
		});
	};

	const startRename = (id: string, currentUsername: string) => {
		setRenamingId(id);
		setRenameValue(currentUsername);
	};

	const cancelRename = () => {
		setRenamingId(null);
		setRenameValue("");
	};

	const saveRename = (id: string) => {
		const newName = renameValue.trim();
		if (!newName) {
			flash("Username tidak boleh kosong", "error");
			return;
		}
		setNotice(null);
		startTransition(async () => {
			const res = await renameProfileAction(id, newName);
			if (res?.error) {
				flash(res.error, "error");
				return;
			}
			flash("@username berhasil diperbarui", "success");
			setRenamingId(null);
			setRenameValue("");
			router.refresh();
		});
	};

	return (
		<div className="p-6">
			{notice && (
				<div
					className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
						notice.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-700"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{notice.text}
				</div>
			)}

			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-bold text-zinc-900">Halaman Profil</h2>
					<p className="text-sm text-zinc-500">
						{profiles.length} halaman · {isPro ? "PRO" : "Free"} user
					</p>
				</div>
				{canCreate ? (
					<button
						onClick={() => setShowCreate((s) => !s)}
						disabled={isPending}
						className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						Buat Profil
					</button>
				) : (
					<Link
						href="/dashboard/subscription"
						className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
						</svg>
						Upgrade ke Pro
					</Link>
				)}
			</div>

			{showCreate && canCreate && (
				<div className="mb-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
					<div className="mb-3 font-medium text-zinc-800">Buat Halaman Baru</div>
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="flex-1">
							<label className="mb-1 block text-xs font-medium text-zinc-500">Username</label>
							<div className="flex items-center rounded-lg border border-zinc-300 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
								<span className="pl-3 text-zinc-400">@</span>
								<input
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="username-anda"
									className="w-full rounded-lg bg-transparent px-2 py-2 text-sm outline-none"
								/>
							</div>
						</div>
						<div className="flex-1">
							<label className="mb-1 block text-xs font-medium text-zinc-500">Display Name</label>
							<input
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Nama Tampilan"
								className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
							/>
						</div>
					</div>
					<div className="mt-3 flex items-center gap-2">
						<button
							onClick={createProfile}
							disabled={isPending}
							className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
						>
							{isPending ? "Membuat..." : "Simpan Profil"}
						</button>
						<button
							onClick={() => setShowCreate(false)}
							className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-600"
						>
							Batal
						</button>
					</div>
				</div>
			)}

			{/* Profiles list */}
			{profiles.length === 0 ? (
				<div className="rounded-lg border-2 border-dashed border-zinc-200 p-10 text-center text-zinc-500">
					Belum ada halaman profil. Klik &quot;Buat Profil&quot; untuk mulai.
				</div>
			) : (
				<ul className="space-y-3">
					{profiles.map((p) => {
						const isActive = p.id === activeProfileId;
						return (
							<li
								key={p.id}
								className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
									isActive ? "border-emerald-300 bg-emerald-50/40" : "border-zinc-200 bg-white"
								}`}
							>
								<div className="flex items-center gap-3">
									<div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
										<img
											src={p.avatarUrl || "/default-avatar.svg"}
											alt={p.displayName}
											className="h-full w-full object-cover"
										/>
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-semibold text-zinc-900">{p.displayName}</span>
											{isActive && (
												<span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
													Aktif
												</span>
											)}
										</div>
										{renamingId === p.id ? (
											<div className="mt-1 flex items-center gap-2">
												<span className="text-zinc-400">@</span>
												<input
													autoFocus
													value={renameValue}
													onChange={(e) => setRenameValue(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") saveRename(p.id);
														if (e.key === "Escape") cancelRename();
													}}
													className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
												/>
											</div>
										) : (
											<div className="text-sm text-zinc-500">@{p.username}</div>
										)}
										<div className="text-xs text-zinc-400">
											Dibuat {new Date(p.createdAt).toLocaleDateString("id-ID")}
										</div>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<a
										href={`/@${p.username}`}
										target="_blank"
										rel="noopener noreferrer"
										className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
									>
										Lihat
									</a>
									{!isActive && (
										<button
											onClick={() => setActive(p.id, false)}
											disabled={isPending}
											className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
										>
											Jadikan Aktif
										</button>
									)}
									<button
										onClick={() => setActive(p.id, true)}
										disabled={isPending}
										className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
									>
										Edit
									</button>
									{renamingId === p.id ? (
										<>
											<button
												onClick={() => saveRename(p.id)}
												disabled={isPending}
												className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
											>
												Simpan
											</button>
											<button
												onClick={cancelRename}
												disabled={isPending}
												className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
											>
												Batal
											</button>
										</>
									) : (
										<button
											onClick={() => startRename(p.id, p.username)}
											disabled={isPending}
											className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
										>
											Ganti Username
										</button>
									)}
									<button
										onClick={() => remove(p.id, p.username)}
										disabled={isPending || profiles.length <= 1}
										title={profiles.length <= 1 ? "Minimal satu profil harus ada" : "Hapus profil"}
										className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Hapus
									</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction, updatePasswordAction, deleteAccountAction, getAnalyticsAction } from "./serverActions";
import { THEME_PRESETS, type ThemePreset } from "@/lib/theme-presets";
import { BG_PATTERNS, type BgPattern } from "@/lib/bg-patterns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faUser, faChartLine, faCog, faEye, faCrown } from "@fortawesome/free-solid-svg-icons";
import AvatarUpload from "@/components/AvatarUpload";
import LogoUpload from "@/components/LogoUpload";

type BlockItem = {
	id: string;
	type: string;
	dataJson: string;
	order: number;
	isVisible: boolean;
};

export default function DashboardTabsClient({
	username,
	profile,
	blocks,
}: {
	username: string;
	profile: { 
		id: string; 
		username: string; 
		displayName: string; 
		bio: string | null; 
		avatarUrl: string | null; 
		logoUrl?: string | null;
		bgType?: string | null;
		bgSolidColor?: string | null;
		bgImageUrl?: string | null;
		bgPatternId?: string | null;
		bgGradientColors?: string | null;
		showAvatar?: boolean | null;
		showDisplayName?: boolean | null;
		showBio?: boolean | null;
		showLogo?: boolean | null;
		showQr?: boolean | null;
		showIcons?: boolean | null;
		stickyHeaderBg?: boolean | null;
		themePresetId?: string | null;
		useCustomColors?: boolean | null;
		customColors?: string | null;
		detailedColors?: string | null;
	};
	blocks: BlockItem[];
}) {
	const [tab, setTab] = useState<"setting" | "analytics" | "subscription">("setting");
	const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	function showSuccess(text: string) {
		if (timerRef.current) clearTimeout(timerRef.current);
		setNotice({ type: "success", text });
		timerRef.current = setTimeout(() => setNotice(null), 2000);
	}

	return (
		<div>
			<nav className="mb-6 overflow-x-auto border-b border-zinc-200 pb-4 scrollbar-hide">
				<div className="flex min-w-max gap-0.5">
					<Tab icon={faChartLine} label="Analytics" active={tab === "analytics"} onClick={() => setTab("analytics")} />
					<Tab icon={faCog} label="Setting" active={tab === "setting"} onClick={() => setTab("setting")} />
					<Tab icon={faCrown} label="Subscription" active={tab === "subscription"} onClick={() => setTab("subscription")} />
				</div>
			</nav>
			{tab === "analytics" ? (
				<div className="space-y-6">
					<h2 className="ml-2 text-2xl font-bold text-zinc-900">Analytics</h2>
					<AnalyticsPanel profileId={profile.id} username={username} />
				</div>
			) : null}
			{tab === "setting" ? (
				<div className="space-y-6">
					<h2 className="ml-2 text-2xl font-bold text-zinc-900">Setting</h2>
					<SettingsPanel username={username} profile={profile} onSaved={() => showSuccess("Tersimpan")} />
				</div>
			) : null}
			{tab === "subscription" ? (
				<div className="space-y-6">
					<h2 className="ml-2 text-2xl font-bold text-zinc-900">Subscription</h2>
					<div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-8 text-center">
						<div className="mb-4">
							<svg className="mx-auto h-16 w-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 className="text-xl font-bold text-zinc-900 mb-2">Fitur Subscription Segera Hadir</h3>
						<p className="text-zinc-600 mb-4">
							Kami sedang mempersiapkan fitur subscription untuk memberikan pengalaman yang lebih baik.
							Terima kasih atas kesabaran Anda!
						</p>
					</div>
				</div>
			) : null}
			{notice ? (
				<div
					className={`fixed bottom-4 right-4 rounded px-4 py-2 text-sm text-white ${
						notice.type === "success" ? "bg-emerald-600" : "bg-red-600"
					}`}
				>
					{notice.text}
				</div>
			) : null}
		</div>
	);
}

function Tab({ icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center justify-center rounded-lg p-3 transition-all duration-200 ${
				active 
					? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/30" 
					: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400"
			}`}
			title={label}
		>
			<FontAwesomeIcon icon={icon} className="h-5 w-5" />
		</button>
	);
}

function ProfileForm({
	profile,
	onSaved,
}: {
	profile: { id: string; displayName: string; bio: string | null; avatarUrl: string | null; logoUrl?: string | null; };
	onSaved: () => void;
}) {
	const [pending, startTransition] = useTransition();
	const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "/default-avatar.svg");
	const [logoPreview, setLogoPreview] = useState(profile.logoUrl || "/default-logo.svg");
	
	return (
		<form
			action={async (formData) => {
				const displayName = String(formData.get("displayName") ?? "");
				const bio = String(formData.get("bio") ?? "");
				const avatarUrl = String(formData.get("avatarUrl") ?? "");
				const logoUrl = String(formData.get("logoUrl") ?? "");
				await updateProfileAction(profile.id, { displayName, bio, avatarUrl, logoUrl });
				onSaved();
			}}
			className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2"
		>
			<div className="sm:col-span-2 font-medium">Profil</div>
			<label className="text-sm">
				<div className="mb-1">Display Name</div>
				<input
					name="displayName"
					defaultValue={profile.displayName}
					className="w-full rounded border border-zinc-300 px-3 py-2"
					required
				/>
			</label>
	<div className="sm:col-span-2 space-y-4">
		<div>
			<div className="mb-2 text-sm font-medium">Avatar</div>
			<AvatarUpload 
				currentAvatarUrl={profile.avatarUrl}
				onUploadSuccess={(url) => {
					setAvatarPreview(url);
				}}
			/>
		</div>
		
		<div>
			<div className="mb-2 text-sm font-medium">Logo</div>
			<LogoUpload 
				currentLogoUrl={profile.logoUrl}
				onUploadSuccess={(url) => {
					// Avatar/Logo will update via onSaved callback
				}}
			/>
		</div>
	</div>
	<label className="text-sm sm:col-span-2">
			<div className="mb-1">Bio</div>
			<textarea
				name="bio"
				defaultValue={profile.bio ?? ""}
				className="w-full rounded border border-zinc-300 px-3 py-2"
				rows={3}
			/>
		</label>
			<div className="sm:col-span-2">
				<button className="rounded bg-black px-4 py-2 text-white" disabled={pending}>
					{pending ? "Menyimpan..." : "Simpan"}
				</button>
			</div>
		</form>
	);
}

function SettingsPanel({
	username,
	profile,
	onSaved,
}: {
	username: string;
	profile: { 
		id: string; 
		username: string; 
		displayName: string; 
		bio: string | null; 
		avatarUrl: string | null;
		bgType?: string | null;
		bgSolidColor?: string | null;
		bgImageUrl?: string | null;
		bgPatternId?: string | null;
		bgGradientColors?: string | null;
		showAvatar?: boolean | null;
		showDisplayName?: boolean | null;
		showBio?: boolean | null;
		showLogo?: boolean | null;
		showQr?: boolean | null;
		showIcons?: boolean | null;
		stickyHeaderBg?: boolean | null;
		themePresetId?: string | null;
		useCustomColors?: boolean | null;
		customColors?: string | null;
		detailedColors?: string | null;
	};
	onSaved: () => void;
}) {
	const [subTab, setSubTab] = useState<"qr" | "tema" | "background" | "color" | "privasi">("qr");
	const [isPending, startTransition] = useTransition();
	const [useCustom, setUseCustom] = useState(!!profile.useCustomColors);
	const [bgType, setBgType] = useState<string>(profile.bgType || "none");
	
	// Parse custom colors
	let customColors = { primary: "#000000", secondary: "#ffffff", background: "#ffffff", text: "#000000" };
	try {
		if (profile.customColors) {
			customColors = { ...customColors, ...JSON.parse(profile.customColors) };
		}
	} catch {}
	
	// Parse gradient colors
	let gradientColors = { color1: "#667eea", color2: "#764ba2", color3: "#f093fb" };
	try {
		if (profile.bgGradientColors) {
			gradientColors = { ...gradientColors, ...JSON.parse(profile.bgGradientColors) };
		}
	} catch {}
	
	// Parse detailed colors
	let detailedColors = {
		useTextColor: false,
		textColor: "#18181b",
		useHeaderColor: false,
		headerColor: "#000000",
		useTitleColor: false,
		titleColor: "#000000",
		useButtonColor: false,
		buttonColor: "#000000",
		useLinkColor: false,
		linkColor: "#3b82f6"
	};
	try {
		if (profile.detailedColors) {
			detailedColors = { ...detailedColors, ...JSON.parse(profile.detailedColors) };
		}
	} catch {}
	
	return (
		<div className="space-y-4">
			{/* Sub-tab navigation */}
			<nav className="flex gap-2 border-b border-zinc-200">
				<button
					onClick={() => setSubTab("qr")}
					className={`px-4 py-2 text-sm font-medium transition ${
						subTab === "qr"
							? "border-b-2 border-black text-black"
							: "text-zinc-500 hover:text-zinc-700"
					}`}
				>
					QR
				</button>
			<button
				onClick={() => setSubTab("tema")}
				className={`px-4 py-2 text-sm font-medium transition ${
					subTab === "tema"
						? "border-b-2 border-black text-black"
						: "text-zinc-500 hover:text-zinc-700"
				}`}
			>
				Tema
			</button>
			<button
				onClick={() => setSubTab("background")}
				className={`px-4 py-2 text-sm font-medium transition ${
					subTab === "background"
						? "border-b-2 border-black text-black"
						: "text-zinc-500 hover:text-zinc-700"
				}`}
			>
				Background
			</button>
			<button
				onClick={() => setSubTab("color")}
				className={`px-4 py-2 text-sm font-medium transition ${
					subTab === "color"
						? "border-b-2 border-black text-black"
						: "text-zinc-500 hover:text-zinc-700"
				}`}
			>
				Color
			</button>
			<button
				onClick={() => setSubTab("privasi")}
				className={`px-4 py-2 text-sm font-medium transition ${
					subTab === "privasi"
						? "border-b-2 border-black text-black"
						: "text-zinc-500 hover:text-zinc-700"
				}`}
			>
				Privasi
			</button>
		</nav>

			{/* QR Sub-tab */}
			{subTab === "qr" ? (
				<div className="grid gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2">
					<div className="sm:col-span-2 font-medium">QR Code</div>
			<div className="flex items-center gap-2">
				<a
					href={`/api/qr/${encodeURIComponent(username)}?format=svg`}
					download={`qr-${username}.svg`}
					className="rounded border px-3 py-2 text-sm"
				>
					Download SVG
				</a>
				<a
					href={`/api/qr/${encodeURIComponent(username)}?format=png`}
					download={`qr-${username}.png`}
					className="rounded border px-3 py-2 text-sm"
				>
					Download PNG
				</a>
				<a
					href={`/u/${encodeURIComponent(username)}/card`}
					target="_blank"
					className="rounded border px-3 py-2 text-sm"
				>
					Kartu Nama
				</a>
			</div>
			<div className="sm:col-span-2 mt-3">
				<div className="text-sm mb-2 text-zinc-600">Preview QR</div>
				<div className="rounded-lg border border-zinc-200 p-4 inline-block bg-white">
					<img
						src={`/api/qr/${encodeURIComponent(username)}?format=svg`}
						alt={`QR @${username}`}
						className="h-40 w-40"
					/>
				</div>
			</div>
			<div className="sm:col-span-2 space-y-3">
				<form
					action={async (formData) => {
						const showAvatar = formData.get("showAvatar") === "on";
						await updateProfileAction(profile.id, { showAvatar } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="showAvatar" defaultChecked={!!profile.showAvatar} />
						<label className="text-sm">Tampilkan avatar di halaman publik</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
				<form
					action={async (formData) => {
						const showDisplayName = formData.get("showDisplayName") === "on";
						await updateProfileAction(profile.id, { showDisplayName } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="showDisplayName" defaultChecked={!!profile.showDisplayName} />
						<label className="text-sm">Tampilkan display name di halaman publik</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
				<form
					action={async (formData) => {
						const showBio = formData.get("showBio") === "on";
						await updateProfileAction(profile.id, { showBio } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="showBio" defaultChecked={!!profile.showBio} />
						<label className="text-sm">Tampilkan bio di halaman publik</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
				<form
					action={async (formData) => {
						const showLogo = formData.get("showLogo") === "on";
						await updateProfileAction(profile.id, { showLogo } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="showLogo" defaultChecked={!!profile.showLogo} />
						<label className="text-sm">Tampilkan logo di halaman publik</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
				<form
					action={async (formData) => {
						const showQr = formData.get("showQr") === "on";
						await updateProfileAction(profile.id, { showQr } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="showQr" defaultChecked={!!profile.showQr} />
						<label className="text-sm">Tampilkan QR di halaman publik</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
				<form
					action={async (formData) => {
						const showIcons = formData.get("showIcons") === "on";
						await updateProfileAction(profile.id, { showIcons } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="showIcons" defaultChecked={!!profile.showIcons} />
						<label className="text-sm">Tampilkan ikon di halaman publik</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
				<form
					action={async (formData) => {
						const stickyHeaderBg = formData.get("stickyHeaderBg") === "on";
						await updateProfileAction(profile.id, { stickyHeaderBg } as any);
						onSaved();
					}}
					className="grid grid-cols-[1fr_auto] items-center gap-3"
				>
					<div className="flex items-center gap-2">
						<input type="checkbox" name="stickyHeaderBg" defaultChecked={!!profile.stickyHeaderBg} />
						<label className="text-sm">Tampilkan background header sticky</label>
					</div>
					<button className="rounded bg-black px-2 py-1 text-white text-sm" aria-label="Simpan">
						<FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</form>
			</div>
		</div>
			) : null}

			{/* Tema Sub-tab */}
			{subTab === "tema" ? (
				<div className="grid gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-2">
					<div className="sm:col-span-2 font-medium">Template Tema</div>
			<div className="sm:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{THEME_PRESETS.map((preset) => {
					const isActive = profile.themePresetId === preset.id;
					return (
						<div
							key={preset.id}
							className={`rounded-lg border-2 p-3 transition ${
								isActive ? "border-black bg-zinc-50" : "border-zinc-200 bg-white"
							}`}
						>
							<div className="mb-2 flex items-center justify-between">
								<div className="font-medium text-sm">{preset.name}</div>
								{isActive ? (
									<div className="rounded-full bg-black px-2 py-0.5 text-xs text-white">Aktif</div>
								) : null}
							</div>
							<div className="mb-2 text-xs text-zinc-600">{preset.description}</div>
							<div className="mb-3 flex gap-2">
								<div
									className="h-8 w-8 rounded"
									style={{ backgroundColor: preset.primary }}
									title={`Primary: ${preset.primary}`}
								/>
								<div
									className="h-8 w-8 rounded"
									style={{ backgroundColor: preset.secondary }}
									title={`Secondary: ${preset.secondary}`}
								/>
								<div
									className="h-8 w-8 rounded border border-zinc-300"
									style={{ backgroundColor: preset.background }}
									title={`Background: ${preset.background}`}
								/>
							</div>
							<button
								onClick={() => {
									startTransition(async () => {
										await updateProfileAction(profile.id, { themePresetId: preset.id } as any);
										onSaved();
									});
								}}
								disabled={isPending || isActive}
								className={`w-full rounded px-3 py-1.5 text-xs font-medium ${
									isActive
										? "cursor-not-allowed bg-zinc-200 text-zinc-500"
										: "bg-black text-white hover:bg-zinc-800"
								}`}
							>
								{isActive ? "Sedang Digunakan" : "Gunakan"}
							</button>
						</div>
					);
			})}
		</div>
		
		{/* Custom Colors */}
		<div className="sm:col-span-2 mt-6 pt-6 border-t border-zinc-200">
				<div className="font-medium mb-2">Custom Colors</div>
				<div className="text-xs text-zinc-500 mb-4">Override warna dari tema preset</div>
				
				{/* Toggle checkbox */}
				<form
					action={async (formData) => {
						const useCustomColors = formData.get("useCustomColors") === "on";
						setUseCustom(useCustomColors);
						await updateProfileAction(profile.id, { useCustomColors } as any);
						onSaved();
					}}
					className="mb-4 flex items-center gap-2"
				>
					<input 
						type="checkbox" 
						name="useCustomColors" 
						defaultChecked={useCustom}
						onChange={(e) => setUseCustom(e.target.checked)}
					/>
					<label className="text-sm">Gunakan Custom Colors</label>
					<button type="submit" className="rounded bg-black px-3 py-1 text-white text-sm">Simpan</button>
				</form>

				{/* Color pickers - only show if enabled */}
				{useCustom ? (
					<form
					action={async (formData) => {
						const primary = String(formData.get("primary") ?? customColors.primary);
						const secondary = String(formData.get("secondary") ?? customColors.secondary);
						const background = String(formData.get("background") ?? customColors.background);
						const text = String(formData.get("text") ?? customColors.text);
						const customColorsJson = JSON.stringify({ primary, secondary, background, text });
						await updateProfileAction(profile.id, { customColors: customColorsJson } as any);
						onSaved();
					}}
					className="grid gap-3 sm:grid-cols-2"
				>
					<label className="flex flex-col gap-1">
						<span className="text-xs font-medium">Primary</span>
						<div className="flex items-center gap-2">
							<input
								type="color"
								name="primary"
								defaultValue={customColors.primary}
								className="h-10 w-14 rounded border border-zinc-300 cursor-pointer"
							/>
							<input
								type="text"
								defaultValue={customColors.primary}
								className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs"
								placeholder="#000000"
							/>
						</div>
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-xs font-medium">Secondary</span>
						<div className="flex items-center gap-2">
							<input
								type="color"
								name="secondary"
								defaultValue={customColors.secondary}
								className="h-10 w-14 rounded border border-zinc-300 cursor-pointer"
							/>
							<input
								type="text"
								defaultValue={customColors.secondary}
								className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs"
								placeholder="#ffffff"
							/>
						</div>
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-xs font-medium">Background</span>
						<div className="flex items-center gap-2">
							<input
								type="color"
								name="background"
								defaultValue={customColors.background}
								className="h-10 w-14 rounded border border-zinc-300 cursor-pointer"
							/>
							<input
								type="text"
								defaultValue={customColors.background}
								className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs"
								placeholder="#ffffff"
							/>
						</div>
					</label>
					<label className="flex flex-col gap-1">
						<span className="text-xs font-medium">Text</span>
						<div className="flex items-center gap-2">
							<input
								type="color"
								name="text"
								defaultValue={customColors.text}
								className="h-10 w-14 rounded border border-zinc-300 cursor-pointer"
							/>
							<input
								type="text"
								defaultValue={customColors.text}
								className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs"
								placeholder="#000000"
							/>
						</div>
					</label>
					<div className="sm:col-span-2">
						<button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 transition">
							Simpan Custom Colors
						</button>
					</div>
				</form>
				) : (
					<div className="text-sm text-zinc-500 italic">
						Centang "Gunakan Custom Colors" di atas untuk customize warna
					</div>
				)}
			</div>
		</div>
			) : null}

		{/* Background Sub-tab */}
		{subTab === "background" ? (
			<div className="space-y-6">
			{/* Background Type Selector */}
			<div className="grid gap-4 rounded-lg border border-zinc-200 p-4">
				<div className="font-medium">Pilih Tipe Background</div>
				<div className="text-xs text-zinc-500 mb-2">Pilih satu tipe background untuk halaman profil</div>
				<div className="flex flex-col gap-2">
					<label className="text-sm font-medium">Tipe Background</label>
					<select
						value={bgType}
						onChange={(e) => {
							const newType = e.target.value;
							setBgType(newType);
							startTransition(async () => {
								await updateProfileAction(profile.id, { bgType: newType } as any);
								onSaved();
							});
						}}
						className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
					>
						<option value="none">Tidak Ada (Dari Tema)</option>
						<option value="solid">Solid Color Custom</option>
						<option value="pattern">Pattern SVG</option>
						<option value="image">Custom Image</option>
						<option value="gradient">Gradient (3 Warna)</option>
					</select>
					<div className="text-xs text-zinc-500">
						{bgType === "none" && "Background menggunakan warna dari tema aktif"}
						{bgType === "solid" && "Background warna solid custom (override tema)"}
						{bgType === "pattern" && "Background pattern SVG yang dapat diulang"}
						{bgType === "image" && "Background gambar custom dari URL"}
						{bgType === "gradient" && "Background gradient dengan 3 warna custom"}
					</div>
				</div>
			</div>

				{/* Solid Color - only show if bgType === "solid" */}
				{bgType === "solid" ? (
					<div className="grid gap-4 rounded-lg border border-zinc-200 p-4">
						<div className="font-medium">Solid Color Custom</div>
						<div className="text-xs text-zinc-500 mb-2">Pilih warna solid untuk background</div>
						<form
							action={async (formData) => {
								const bgSolidColor = String(formData.get("bgSolidColor") ?? "#ffffff");
								await updateProfileAction(profile.id, { bgSolidColor } as any);
								onSaved();
							}}
							className="flex flex-col gap-4"
						>
							<label className="flex flex-col gap-2">
								<span className="text-sm font-medium">Pilih Warna</span>
								<div className="flex items-center gap-3">
									<input
										type="color"
										name="bgSolidColor"
										defaultValue={profile.bgSolidColor ?? "#ffffff"}
										className="h-12 w-20 rounded border border-zinc-300 cursor-pointer"
									/>
									<input
										type="text"
										value={profile.bgSolidColor ?? "#ffffff"}
										readOnly
										className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-zinc-50"
										placeholder="#ffffff"
									/>
								</div>
								<div className="text-xs text-zinc-500">
									Pilih warna solid untuk background (akan override warna tema)
								</div>
							</label>
							
							{/* Preview */}
							<div className="text-xs text-zinc-500">
								Preview:
								<div 
									className="mt-2 h-32 w-full rounded border overflow-hidden"
									style={{
										backgroundColor: profile.bgSolidColor ?? "#ffffff"
									}}
								/>
							</div>

							<button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 transition self-start">
								Simpan Solid Color
							</button>
						</form>
					</div>
				) : null}

				{/* Pattern Presets - only show if bgType === "pattern" */}
				{bgType === "pattern" ? (
					<div className="grid gap-4 rounded-lg border border-zinc-200 p-4">
						<div className="font-medium">Pattern Bawaan</div>
						<div className="text-xs text-zinc-500 mb-2">Pilih dari 6 pattern SVG yang sudah tersedia</div>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{BG_PATTERNS.map((pattern) => {
							const isActive = bgType === "pattern" && profile.bgPatternId === pattern.id;
							return (
									<div
										key={pattern.id}
										className={`rounded-lg border-2 p-3 transition ${
											isActive ? "border-black bg-zinc-50" : "border-zinc-200 bg-white"
										}`}
									>
										<div className="mb-2 flex items-center justify-between">
											<div className="font-medium text-sm">{pattern.name}</div>
											{isActive ? (
												<div className="rounded-full bg-black px-2 py-0.5 text-xs text-white">Aktif</div>
											) : null}
										</div>
										<div className="mb-2 text-xs text-zinc-600">{pattern.description}</div>
										<div 
											className="mb-3 h-24 rounded border border-zinc-200 bg-white"
											style={{ 
												backgroundImage: `url("${pattern.dataUrl}")`,
												backgroundRepeat: "repeat",
											}}
										/>
										<button
											onClick={() => {
												startTransition(async () => {
													await updateProfileAction(profile.id, { bgPatternId: pattern.id, bgImageUrl: "" } as any);
													onSaved();
												});
											}}
											disabled={isPending || isActive}
											className={`w-full rounded px-3 py-1.5 text-xs font-medium ${
												isActive
													? "cursor-not-allowed bg-zinc-200 text-zinc-500"
													: "bg-black text-white hover:bg-zinc-800"
											}`}
										>
											{isActive ? "Sedang Digunakan" : "Gunakan"}
										</button>
									</div>
								);
							})}
						</div>
					</div>
				) : null}

				{/* Custom Background Image - only show if bgType === "image" */}
				{bgType === "image" ? (
					<div className="grid gap-4 rounded-lg border border-zinc-200 p-4">
						<div className="font-medium">Custom Background Image</div>
						<div className="text-xs text-zinc-500 mb-2">Atau gunakan gambar custom dari URL</div>
						<form
							action={async (formData) => {
								const bgImageUrl = String(formData.get("bgImageUrl") ?? "");
								await updateProfileAction(profile.id, { bgImageUrl, bgPatternId: "" } as any);
								onSaved();
							}}
							className="flex flex-col gap-3"
						>
							<label className="text-sm">
								<div className="mb-1">Background Image URL</div>
								<input
									name="bgImageUrl"
									defaultValue={profile.bgImageUrl ?? ""}
									placeholder="https://background.jpg atau https://unsplash.com/..."
									className="w-full rounded border border-zinc-300 px-3 py-2"
								/>
								<div className="mt-1 text-xs text-zinc-500">
									Masukkan URL gambar untuk background halaman profil (akan override pattern)
								</div>
							</label>
							{profile.bgImageUrl ? (
								<div className="text-xs text-zinc-500">
									Preview:
									<div className="mt-2 h-32 w-full rounded border overflow-hidden">
										<div 
											className="h-full w-full bg-cover bg-center"
											style={{ backgroundImage: `url(${profile.bgImageUrl})` }}
										/>
									</div>
								</div>
							) : null}
							<button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 transition self-start">
								Simpan Custom Image
							</button>
					</form>
				</div>
				) : null}

				{/* Gradient Background - only show if bgType === "gradient" */}
				{bgType === "gradient" ? (
					<div className="grid gap-4 rounded-lg border border-zinc-200 p-4">
						<div className="font-medium">Gradient Background (3 Warna)</div>
						<div className="text-xs text-zinc-500 mb-2">Pilih 3 warna untuk gradient background</div>
						<form
							action={async (formData) => {
								const color1 = String(formData.get("color1") ?? gradientColors.color1);
								const color2 = String(formData.get("color2") ?? gradientColors.color2);
								const color3 = String(formData.get("color3") ?? gradientColors.color3);
								const bgGradientColors = JSON.stringify({ color1, color2, color3 });
								await updateProfileAction(profile.id, { bgGradientColors } as any);
								onSaved();
							}}
							className="flex flex-col gap-4"
						>
							<div className="grid gap-3 sm:grid-cols-3">
								<label className="flex flex-col gap-2">
									<span className="text-xs font-medium">Warna 1 (Atas)</span>
									<div className="flex items-center gap-2">
										<input
											type="color"
											name="color1"
											defaultValue={gradientColors.color1}
											className="h-12 w-full rounded border border-zinc-300 cursor-pointer"
										/>
									</div>
									<input
										type="text"
										defaultValue={gradientColors.color1}
										className="rounded border border-zinc-300 px-2 py-1 text-xs"
										placeholder="#667eea"
										readOnly
									/>
								</label>
								<label className="flex flex-col gap-2">
									<span className="text-xs font-medium">Warna 2 (Tengah)</span>
									<div className="flex items-center gap-2">
										<input
											type="color"
											name="color2"
											defaultValue={gradientColors.color2}
											className="h-12 w-full rounded border border-zinc-300 cursor-pointer"
										/>
									</div>
									<input
										type="text"
										defaultValue={gradientColors.color2}
										className="rounded border border-zinc-300 px-2 py-1 text-xs"
										placeholder="#764ba2"
										readOnly
									/>
								</label>
								<label className="flex flex-col gap-2">
									<span className="text-xs font-medium">Warna 3 (Bawah)</span>
									<div className="flex items-center gap-2">
										<input
											type="color"
											name="color3"
											defaultValue={gradientColors.color3}
											className="h-12 w-full rounded border border-zinc-300 cursor-pointer"
										/>
									</div>
									<input
										type="text"
										defaultValue={gradientColors.color3}
										className="rounded border border-zinc-300 px-2 py-1 text-xs"
										placeholder="#f093fb"
										readOnly
									/>
								</label>
							</div>
							
							{/* Preview */}
							<div className="text-xs text-zinc-500">
								Preview:
								<div 
									className="mt-2 h-32 w-full rounded border overflow-hidden"
									style={{
										background: `linear-gradient(135deg, ${gradientColors.color1} 0%, ${gradientColors.color2} 50%, ${gradientColors.color3} 100%)`
									}}
								/>
							</div>

							<button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 transition self-start">
								Simpan Gradient
							</button>
						</form>
					</div>
				) : null}
			</div>
		) : null}

		{/* Color Sub-tab */}
		{subTab === "color" ? (
			<div className="space-y-6">
				<div className="grid gap-4 rounded-lg border border-zinc-200 p-4">
					<div className="font-medium">Detailed Color Settings</div>
					<div className="text-xs text-zinc-500 mb-2">Customize warna untuk elemen-elemen spesifik di halaman profil</div>
					
					<form
						action={async (formData) => {
							const useTextColor = formData.get("useTextColor") === "on";
							const textColor = String(formData.get("textColor") ?? detailedColors.textColor);
							const useHeaderColor = formData.get("useHeaderColor") === "on";
							const headerColor = String(formData.get("headerColor") ?? detailedColors.headerColor);
							const useTitleColor = formData.get("useTitleColor") === "on";
							const titleColor = String(formData.get("titleColor") ?? detailedColors.titleColor);
							const useButtonColor = formData.get("useButtonColor") === "on";
							const buttonColor = String(formData.get("buttonColor") ?? detailedColors.buttonColor);
							const useLinkColor = formData.get("useLinkColor") === "on";
							const linkColor = String(formData.get("linkColor") ?? detailedColors.linkColor);
							
							const detailedColorsData = JSON.stringify({
								useTextColor, textColor,
								useHeaderColor, headerColor,
								useTitleColor, titleColor,
								useButtonColor, buttonColor,
								useLinkColor, linkColor
							});
							
							await updateProfileAction(profile.id, { detailedColors: detailedColorsData } as any);
							onSaved();
						}}
						className="space-y-6"
					>
						{/* Text Color */}
						<div className="rounded-lg border border-zinc-200 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-medium text-sm">Text Color (Body)</div>
									<div className="text-xs text-zinc-500">Warna untuk teks biasa / bio</div>
								</div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										name="useTextColor"
										defaultChecked={detailedColors.useTextColor}
										className="w-4 h-4"
									/>
									<span className="text-xs">Aktifkan</span>
								</label>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="color"
									name="textColor"
									defaultValue={detailedColors.textColor}
									className="h-10 w-16 rounded border border-zinc-300 cursor-pointer"
								/>
								<input
									type="text"
									value={detailedColors.textColor}
									readOnly
									className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-zinc-50"
								/>
							</div>
						</div>

						{/* Header Color */}
						<div className="rounded-lg border border-zinc-200 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-medium text-sm">Header Color</div>
									<div className="text-xs text-zinc-500">Warna untuk nama (@username)</div>
								</div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										name="useHeaderColor"
										defaultChecked={detailedColors.useHeaderColor}
										className="w-4 h-4"
									/>
									<span className="text-xs">Aktifkan</span>
								</label>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="color"
									name="headerColor"
									defaultValue={detailedColors.headerColor}
									className="h-10 w-16 rounded border border-zinc-300 cursor-pointer"
								/>
								<input
									type="text"
									value={detailedColors.headerColor}
									readOnly
									className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-zinc-50"
								/>
							</div>
						</div>

						{/* Title Color */}
						<div className="rounded-lg border border-zinc-200 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-medium text-sm">Title Color (Display Name)</div>
									<div className="text-xs text-zinc-500">Warna untuk display name di header</div>
								</div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										name="useTitleColor"
										defaultChecked={detailedColors.useTitleColor}
										className="w-4 h-4"
									/>
									<span className="text-xs">Aktifkan</span>
								</label>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="color"
									name="titleColor"
									defaultValue={detailedColors.titleColor}
									className="h-10 w-16 rounded border border-zinc-300 cursor-pointer"
								/>
								<input
									type="text"
									value={detailedColors.titleColor}
									readOnly
									className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-zinc-50"
								/>
							</div>
						</div>

						{/* Button Color */}
						<div className="rounded-lg border border-zinc-200 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-medium text-sm">Button Color</div>
									<div className="text-xs text-zinc-500">Warna untuk tombol/link blocks</div>
								</div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										name="useButtonColor"
										defaultChecked={detailedColors.useButtonColor}
										className="w-4 h-4"
									/>
									<span className="text-xs">Aktifkan</span>
								</label>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="color"
									name="buttonColor"
									defaultValue={detailedColors.buttonColor}
									className="h-10 w-16 rounded border border-zinc-300 cursor-pointer"
								/>
								<input
									type="text"
									value={detailedColors.buttonColor}
									readOnly
									className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-zinc-50"
								/>
							</div>
						</div>

						{/* Link Color */}
						<div className="rounded-lg border border-zinc-200 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-medium text-sm">Link Color</div>
									<div className="text-xs text-zinc-500">Warna untuk link text di dalam bio</div>
								</div>
								<label className="flex items-center gap-2">
									<input
										type="checkbox"
										name="useLinkColor"
										defaultChecked={detailedColors.useLinkColor}
										className="w-4 h-4"
									/>
									<span className="text-xs">Aktifkan</span>
								</label>
							</div>
							<div className="flex items-center gap-3">
								<input
									type="color"
									name="linkColor"
									defaultValue={detailedColors.linkColor}
									className="h-10 w-16 rounded border border-zinc-300 cursor-pointer"
								/>
								<input
									type="text"
									value={detailedColors.linkColor}
									readOnly
									className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm bg-zinc-50"
								/>
							</div>
						</div>

						<button type="submit" className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 transition">
							Simpan Color Settings
						</button>
					</form>
				</div>
			</div>
		) : null}

		{/* Privasi Sub-tab */}
		{subTab === "privasi" ? (
			<PrivacyPanel onSaved={onSaved} />
		) : null}
		</div>
	);
}

function PrivacyPanel({ onSaved }: { onSaved: () => void }) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	async function handleChangePassword(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(null);

		// Validation
		if (newPassword.length < 6) {
			setError("Password baru minimal 6 karakter");
			setLoading(false);
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Password baru dan konfirmasi tidak cocok");
			setLoading(false);
			return;
		}

		const result = await updatePasswordAction(currentPassword, newPassword);

		if (result.success) {
			setSuccess("Password berhasil diubah");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			onSaved();
		} else {
			setError(result.error || "Gagal mengubah password");
		}

		setLoading(false);
	}

	async function handleDeleteAccount(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		if (deleteConfirm !== "HAPUS") {
			setError("Harap ketik 'HAPUS' untuk konfirmasi");
			setLoading(false);
			return;
		}

		try {
			// Delete account will redirect, so we don't need to handle response
			await deleteAccountAction();
		} catch (error: any) {
			// NEXT_REDIRECT is expected, ignore it
			if (error?.digest?.startsWith('NEXT_REDIRECT')) {
				// Redirect is happening, let it proceed
				return;
			}
			setError("Gagal menghapus akun. Silakan coba lagi.");
			setLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* Password Change Section */}
			<div className="grid gap-4 rounded-lg border border-zinc-200 p-6">
				<div className="mb-2">
					<h3 className="text-lg font-semibold text-zinc-900">Ganti Password</h3>
					<p className="text-sm text-zinc-500">Ubah password akun Anda untuk keamanan yang lebih baik</p>
				</div>

				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
						{error}
					</div>
				)}

				{success && (
					<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
						{success}
					</div>
				)}

				<form onSubmit={handleChangePassword} className="space-y-4">
					<label className="block">
						<span className="mb-1 block text-sm font-medium">Password Saat Ini</span>
						<input
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
							required
							placeholder="Masukkan password saat ini"
						/>
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-medium">Password Baru</span>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
							required
							minLength={6}
							placeholder="Minimal 6 karakter"
						/>
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-medium">Konfirmasi Password Baru</span>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
							required
							minLength={6}
							placeholder="Ulangi password baru"
						/>
					</label>

					<button
						type="submit"
						disabled={loading}
						className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Mengubah..." : "Ubah Password"}
					</button>
				</form>
			</div>

			{/* Delete Account Section */}
			<div className="grid gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
				<div className="mb-2">
					<h3 className="text-lg font-semibold text-red-900">Hapus Akun</h3>
					<p className="text-sm text-red-700">
						Peringatan: Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
					</p>
				</div>

				{!showDeleteConfirm ? (
					<button
						type="button"
						onClick={() => setShowDeleteConfirm(true)}
						className="rounded-lg border-2 border-red-600 bg-white px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
					>
						Hapus Akun Saya
					</button>
				) : (
					<form onSubmit={handleDeleteAccount} className="space-y-4">
						<div className="rounded-lg border border-red-300 bg-white p-4">
							<p className="mb-3 text-sm font-medium text-red-900">
								Anda yakin ingin menghapus akun? Tindakan ini akan:
							</p>
							<ul className="mb-4 ml-4 list-disc space-y-1 text-sm text-red-700">
								<li>Menghapus semua profil dan data Anda</li>
								<li>Menghapus semua blok dan konten</li>
								<li>Menghapus semua statistik dan analitik</li>
								<li>Menghapus akun secara permanen</li>
							</ul>
							<label className="block">
								<span className="mb-2 block text-sm font-medium text-red-900">
									Ketik <strong>HAPUS</strong> untuk konfirmasi:
								</span>
								<input
									type="text"
									value={deleteConfirm}
									onChange={(e) => setDeleteConfirm(e.target.value)}
									className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
									required
									placeholder="HAPUS"
								/>
							</label>
						</div>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => {
									setShowDeleteConfirm(false);
									setDeleteConfirm("");
									setError(null);
								}}
								className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={loading || deleteConfirm !== "HAPUS"}
								className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loading ? "Menghapus..." : "Ya, Hapus Akun Saya"}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}

function AnalyticsPanel({ profileId, username }: { profileId: string; username: string }) {
	const [analytics, setAnalytics] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
	const [resetting, setResetting] = useState(false);

	useEffect(() => {
		async function loadAnalytics() {
			setLoading(true);
			try {
				const data = await getAnalyticsAction(profileId);
				setAnalytics(data);
			} catch (error) {
				console.error("Failed to load analytics:", error);
			} finally {
				setLoading(false);
			}
		}
		loadAnalytics();
	}, [profileId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-zinc-500">Memuat data analytics...</div>
			</div>
		);
	}

	if (!analytics) {
		return (
			<div className="rounded-lg border border-zinc-200 p-6 text-center text-zinc-500">
				Tidak ada data analytics tersedia
			</div>
		);
	}

	const displayVisits = timeRange === "7d" ? analytics.visitsLast7Days : timeRange === "30d" ? analytics.visitsLast30Days : analytics.totalVisits;
	const displayClicks = timeRange === "7d" ? analytics.clicksLast7Days : timeRange === "30d" ? analytics.clicksLast30Days : analytics.totalClicks;

	async function handleResetAnalytics() {
		if (!confirm("Apakah Anda yakin ingin mereset semua data analytics? Tindakan ini tidak dapat dibatalkan.")) {
			return;
		}

		setResetting(true);
		try {
			const response = await fetch("/api/reset-analytics", {
				method: "POST",
			});
			const data = await response.json();
			if (data.success) {
				// Reload analytics data
				const refreshed = await getAnalyticsAction(profileId);
				setAnalytics(refreshed);
				alert("Data analytics berhasil direset");
			} else {
				alert("Gagal mereset data analytics: " + (data.error || "Unknown error"));
			}
		} catch (error) {
			console.error("Reset analytics error:", error);
			alert("Terjadi kesalahan saat mereset data analytics");
		} finally {
			setResetting(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* Header with Time Range Selector */}
			<div className="flex items-center justify-between">
				<div className="pl-2">
					<p className="text-sm text-zinc-500">Statistik kunjungan dan klik</p>
				</div>
				<div className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-1">
					<button
						onClick={() => setTimeRange("7d")}
						className={`rounded px-3 py-1.5 text-xs font-medium transition ${
							timeRange === "7d"
								? "bg-black text-white"
								: "text-zinc-600 hover:bg-zinc-50"
						}`}
					>
						7 Hari
					</button>
					<button
						onClick={() => setTimeRange("30d")}
						className={`rounded px-3 py-1.5 text-xs font-medium transition ${
							timeRange === "30d"
								? "bg-black text-white"
								: "text-zinc-600 hover:bg-zinc-50"
						}`}
					>
						30 Hari
					</button>
					<button
						onClick={() => setTimeRange("all")}
						className={`rounded px-3 py-1.5 text-xs font-medium transition ${
							timeRange === "all"
								? "bg-black text-white"
								: "text-zinc-600 hover:bg-zinc-50"
						}`}
					>
						Semua
					</button>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
				<div className="rounded-lg border border-zinc-200 bg-white p-6">
					<div className="text-sm font-medium text-zinc-500 mb-2">Kunjungan</div>
					<div className="text-3xl font-bold text-zinc-900">{displayVisits.toLocaleString()}</div>
					<div className="text-xs text-zinc-500 mt-1">
						{timeRange === "7d" && "7 hari terakhir"}
						{timeRange === "30d" && "30 hari terakhir"}
						{timeRange === "all" && "Semua waktu"}
					</div>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-white p-6">
					<div className="text-sm font-medium text-zinc-500 mb-2">Klik</div>
					<div className="text-3xl font-bold text-zinc-900">{displayClicks.toLocaleString()}</div>
					<div className="text-xs text-zinc-500 mt-1">
						{timeRange === "7d" && "7 hari terakhir"}
						{timeRange === "30d" && "30 hari terakhir"}
						{timeRange === "all" && "Semua waktu"}
					</div>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-white p-6">
					<div className="text-sm font-medium text-zinc-500 mb-2">Conversion Rate</div>
					<div className="text-3xl font-bold text-zinc-900">
						{analytics.overallConversionRate?.toFixed(1) || "0.0"}%
					</div>
					<div className="text-xs text-zinc-500 mt-1">Klik / Kunjungan</div>
				</div>
				<div className="rounded-lg border border-zinc-200 bg-white p-6">
					<div className="text-sm font-medium text-zinc-500 mb-2">Top Device</div>
					<div className="text-2xl font-bold text-zinc-900">
						{analytics.deviceBreakdown?.[0]?.device || "N/A"}
					</div>
					<div className="text-xs text-zinc-500 mt-1">
						{analytics.deviceBreakdown?.[0]?.count || 0} kunjungan
					</div>
				</div>
			</div>

			{/* Device Breakdown */}
			{analytics.deviceBreakdown && analytics.deviceBreakdown.length > 0 && (
				<div>
					<h3 className="mb-3 text-sm font-semibold text-zinc-900">Breakdown Perangkat</h3>
					<div className="rounded-lg border border-zinc-200 bg-white p-4">
						<div className="space-y-3">
							{analytics.deviceBreakdown.map((item: any) => {
								const total = analytics.deviceBreakdown.reduce((sum: number, d: any) => sum + d.count, 0);
								const percentage = total > 0 ? (item.count / total) * 100 : 0;
								return (
									<div key={item.device} className="space-y-1">
										<div className="flex items-center justify-between text-xs">
											<span className="font-medium text-zinc-900">{item.device}</span>
											<span className="text-zinc-600">{item.count} ({percentage.toFixed(1)}%)</span>
										</div>
										<div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
											<div
												className="h-full bg-emerald-600 transition-all"
												style={{ width: `${percentage}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Clicks Per Block - Table */}
			<div>
				<h3 className="mb-3 text-sm font-semibold text-zinc-900">Klik per Blok</h3>
				{analytics.clicksPerBlock.length === 0 ? (
					<div className="py-6 text-center text-xs text-zinc-500 rounded-lg border border-zinc-200 bg-white">
						Belum ada klik pada blok manapun
					</div>
				) : (
					<div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
						<table className="w-full text-xs">
							<thead className="bg-zinc-50 border-b border-zinc-200">
								<tr>
									<th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">Blok</th>
									<th className="px-4 py-2 text-left text-xs font-medium text-zinc-600">Tipe</th>
									<th className="px-4 py-2 text-right text-xs font-medium text-zinc-600">Klik</th>
									<th className="px-4 py-2 text-right text-xs font-medium text-zinc-600">Conversion</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100">
								{analytics.clicksPerBlock.map((item: any) => (
									<tr key={item.blockId} className="hover:bg-zinc-50 transition">
										<td className="px-4 py-2 text-zinc-900 font-medium">{item.blockTitle}</td>
										<td className="px-4 py-2 text-zinc-500">{item.blockType}</td>
										<td className="px-4 py-2 text-right text-zinc-900 font-semibold">{item.clicks.toLocaleString()}</td>
										<td className="px-4 py-2 text-right text-zinc-600">
											{item.conversionRate?.toFixed(2) || "0.00"}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

function SubscriptionPanel() {
	return (
		<div className="space-y-6">
			{/* Current Plan */}
			<div className="rounded-lg border border-zinc-200 bg-white p-6">
				<div className="mb-4">
					<h3 className="text-lg font-semibold text-zinc-900 mb-2">Paket Saat Ini</h3>
					<div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2">
						<span className="text-sm font-medium text-zinc-700">Free</span>
					</div>
				</div>
				<p className="text-sm text-zinc-600">
					Anda sedang menggunakan paket Free. Upgrade ke Pro untuk mendapatkan fitur premium.
				</p>
			</div>

			{/* Pro Plan Card */}
			<div className="rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
				<div className="mb-4">
					<div className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white mb-3">
						⭐ Pro
					</div>
					<h3 className="text-2xl font-bold text-zinc-900 mb-2">Pro Plan</h3>
					<div className="mb-4">
						<span className="text-4xl font-bold text-zinc-900">Rp 49.000</span>
						<span className="text-zinc-600">/bulan</span>
					</div>
				</div>
				
				<ul className="space-y-3 mb-6">
					<li className="flex items-start gap-2">
						<svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-sm text-zinc-700">Semua fitur Free</span>
					</li>
					<li className="flex items-start gap-2">
						<svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-sm text-zinc-700">A/B Testing</span>
					</li>
					<li className="flex items-start gap-2">
						<svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-sm text-zinc-700">6+ Template premium</span>
					</li>
					<li className="flex items-start gap-2">
						<svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-sm text-zinc-700">Custom domain</span>
					</li>
					<li className="flex items-start gap-2">
						<svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-sm text-zinc-700">Analytics advanced</span>
					</li>
					<li className="flex items-start gap-2">
						<svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						<span className="text-sm text-zinc-700">Priority support</span>
					</li>
				</ul>
				
				<button
					disabled
					className="w-full rounded-lg bg-zinc-300 px-6 py-3 text-center font-semibold text-zinc-500 cursor-not-allowed"
				>
					Segera Hadir
				</button>
			</div>
		</div>
	);
}



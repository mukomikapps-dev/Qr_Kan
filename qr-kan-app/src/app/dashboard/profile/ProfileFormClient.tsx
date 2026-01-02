"use client";
import { useState, useTransition, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { updateProfileAction } from "../serverActions";
import AvatarUpload from "@/components/AvatarUpload";
import LogoUpload from "@/components/LogoUpload";
import StatusUpload from "@/components/StatusUpload";
import CoverImageUpload from "@/components/CoverImageUpload";

export default function ProfileFormClient({
	profile,
}: {
	profile: { 
		id: string; 
		displayName: string; 
		bio: string | null; 
		avatarUrl: string | null; 
		logoUrl?: string | null;
		status?: string | null;
		statusType?: string | null;
		coverImageUrl?: string | null;
		category?: string | null;
	};
}) {
	const [pending, startTransition] = useTransition();
	const searchParams = useSearchParams();
	const router = useRouter();
	
	// Get tab from URL query parameter, default to "edit"
	const tabFromUrl = searchParams.get("tab");
	const initialTab = (tabFromUrl === "status" || tabFromUrl === "editprofile") 
		? (tabFromUrl === "status" ? "status" : "edit")
		: "edit";
	
	const [activeTab, setActiveTab] = useState<"edit" | "status">(initialTab);
	const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
	
	// Sync tab state with URL query parameter
	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab === "status") {
			setActiveTab("status");
		} else if (tab === "editprofile" || !tab) {
			setActiveTab("edit");
		}
	}, [searchParams]);
	
	// Function to change tab and update URL
	const changeTab = (tab: "edit" | "status") => {
		setActiveTab(tab);
		const tabParam = tab === "edit" ? "editprofile" : "status";
		router.push(`/dashboard/profile?tab=${tabParam}`, { scroll: false });
	};
	const [displayName, setDisplayName] = useState(profile.displayName || "");
	const [bio, setBio] = useState(profile.bio || "");
	const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
	const [logoUrl, setLogoUrl] = useState(profile.logoUrl || "");
	const [status, setStatus] = useState(profile.status || "");
	const [statusType, setStatusType] = useState(profile.statusType || "text");
	const [statusImageUrl, setStatusImageUrl] = useState(
		profile.statusType === "image" ? profile.status || "" : ""
	);
	const [coverImageUrl, setCoverImageUrl] = useState(profile.coverImageUrl || "");
	const [category, setCategory] = useState(profile.category || "");
	
	function showSuccess(text: string) {
		setNotice({ type: "success", text });
		setTimeout(() => setNotice(null), 2000);
	}
	
	return (
		<div className="space-y-6">
			{notice && (
				<div
					className={`rounded-xl px-4 py-3 text-sm font-medium text-white shadow-md ${
						notice.type === "success" ? "bg-emerald-600" : "bg-red-600"
					}`}
				>
					{notice.text}
				</div>
			)}
			
			{/* Tab Navigation */}
			<div className="rounded-2xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
				<div className="flex border-b border-zinc-200">
					<button
						type="button"
						onClick={() => changeTab("edit")}
						className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
							activeTab === "edit"
								? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600"
								: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
						}`}
					>
						Edit Profile
					</button>
					<button
						type="button"
						onClick={() => changeTab("status")}
						className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
							activeTab === "status"
								? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600"
								: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
						}`}
					>
						Status
					</button>
				</div>
				
				{/* Tab Content */}
				<div className="p-6">
					<form
						action={async (formData) => {
							startTransition(async () => {
								// Use state values directly for all fields since they're controlled components
								const finalStatus = statusType === "image" ? statusImageUrl : status;
								const finalCoverImageUrl = coverImageUrl;
								// Always send all fields (even if empty) so server action can update
								const updateData: any = {
									displayName: displayName || "", 
									bio: bio || "", 
									avatarUrl: avatarUrl || "", 
									logoUrl: logoUrl || "",
									status: finalStatus ?? "",
									statusType: statusType ?? "text",
									category: category.trim() || null
								};
								// Only include coverImageUrl if it has a value (not empty string)
								if (finalCoverImageUrl && finalCoverImageUrl.trim() !== "") {
									updateData.coverImageUrl = finalCoverImageUrl;
								}
								console.log("Submitting profile update:", updateData);
								console.log("coverImageUrl value:", finalCoverImageUrl, "type:", typeof finalCoverImageUrl, "included:", !!updateData.coverImageUrl);
								try {
									await updateProfileAction(profile.id, updateData);
									showSuccess("Profil berhasil diperbarui");
									// Refresh page to load updated data, but preserve tab
									const currentTab = activeTab === "edit" ? "editprofile" : "status";
									setTimeout(() => {
										router.push(`/dashboard/profile?tab=${currentTab}`);
										router.refresh();
									}, 500);
								} catch (error) {
									console.error("Error updating profile:", error);
									setNotice({ type: "error", text: "Gagal memperbarui profil. Pastikan migration sudah dijalankan." });
								}
							});
						}}
						className="space-y-6"
					>
						{/* Hidden fields for form submission */}
						<input type="hidden" name="avatarUrl" value={avatarUrl || profile.avatarUrl || ""} />
						<input type="hidden" name="logoUrl" value={logoUrl || profile.logoUrl || ""} />
						<input type="hidden" name="statusType" value={statusType} />
						<input type="hidden" name="statusText" value={status} />
						<input type="hidden" name="statusImageUrl" value={statusImageUrl} />
						<input type="hidden" name="coverImageUrl" value={coverImageUrl || profile.coverImageUrl || ""} />

						{/* Tab: Edit Profile */}
						{activeTab === "edit" && (
							<div className="space-y-6">
								<div>
									<h3 className="text-lg font-bold text-zinc-900 mb-1">Edit Profil</h3>
									<p className="text-sm text-zinc-600">Kelola informasi profil Anda</p>
								</div>

								{/* Display Name */}
								<div>
									<label className="block text-sm font-semibold text-zinc-900 mb-2">
										Nama Tampilan
									</label>
									<input
										name="displayName"
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
										placeholder="Masukkan nama tampilan"
										required
									/>
								</div>

								{/* Bio */}
								<div>
									<label className="block text-sm font-semibold text-zinc-900 mb-2">
										Bio / Quote
									</label>
									<textarea
										name="bio"
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none resize-none"
										rows={4}
										placeholder="Tulis bio atau quote inspiratif Anda..."
									/>
									<p className="text-xs text-zinc-500 mt-1">Bio akan ditampilkan di halaman publik Anda</p>
								</div>

								{/* Category */}
								<div>
									<label className="block text-sm font-semibold text-zinc-900 mb-2">
										Kategori
									</label>
									<input
										name="category"
										value={category}
										onChange={(e) => setCategory(e.target.value)}
										className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
										placeholder="Contoh: Kreatif, Bisnis, Group1"
									/>
									<p className="text-xs text-zinc-500 mt-1">
										Bisa memasukkan multiple categories dipisahkan koma. Contoh: "Kreatif, Bisnis, Group1". Di explore page, bisa filter berdasarkan salah satu category.
									</p>
								</div>

								{/* Avatar & Logo Section */}
								<div className="grid gap-6 sm:grid-cols-2">
									<div className="space-y-3">
										<label className="block text-sm font-semibold text-zinc-900">
											Foto Profil
										</label>
										<div className="rounded-xl border-2 border-dashed border-zinc-200 p-6 bg-zinc-50/50">
											<AvatarUpload 
												currentAvatarUrl={avatarUrl || profile.avatarUrl}
												onUploadSuccess={(url) => {
													setAvatarUrl(url);
													showSuccess("Avatar berhasil diupload");
												}}
											/>
										</div>
									</div>
									
									<div className="space-y-3">
										<label className="block text-sm font-semibold text-zinc-900">
											Logo
										</label>
										<div className="rounded-xl border-2 border-dashed border-zinc-200 p-6 bg-zinc-50/50">
											<LogoUpload 
												currentLogoUrl={logoUrl || profile.logoUrl}
												onUploadSuccess={(url) => {
													setLogoUrl(url);
													showSuccess("Logo berhasil diupload");
												}}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Tab: Status */}
						{activeTab === "status" && (
							<div className="space-y-6">
								<div>
									<h3 className="text-lg font-bold text-zinc-900 mb-1">Status & Cover Image</h3>
									<p className="text-sm text-zinc-600">Kelola status dan cover image untuk tampilan di explore</p>
								</div>

								{/* Status Section */}
								<div className="space-y-3">
									<label className="block text-sm font-semibold text-zinc-900">
										Status
									</label>
									<p className="text-xs text-zinc-500 mb-3">Status akan ditampilkan di card explore</p>
									
									{/* Status Type Toggle */}
									<div className="flex gap-2 mb-4">
										<button
											type="button"
											onClick={() => {
												setStatusType("text");
												setStatus("");
												setStatusImageUrl("");
											}}
											className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${
												statusType === "text"
													? "border-emerald-500 bg-emerald-50 text-emerald-700"
													: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
											}`}
										>
											Text
										</button>
										<button
											type="button"
											onClick={() => {
												setStatusType("image");
												setStatus("");
												setStatusImageUrl("");
											}}
											className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${
												statusType === "image"
													? "border-emerald-500 bg-emerald-50 text-emerald-700"
													: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
											}`}
										>
											Gambar
										</button>
									</div>

									{/* Status Input based on type */}
									{statusType === "text" ? (
										<input
											name="statusText"
											value={status}
											onChange={(e) => setStatus(e.target.value)}
											className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
											placeholder="Masukkan status (contoh: Available, Busy, dll)"
											maxLength={50}
										/>
									) : (
										<div className="rounded-xl border-2 border-dashed border-zinc-200 p-6 bg-zinc-50/50">
											<StatusUpload
												currentStatusUrl={statusImageUrl || (profile.statusType === "image" ? profile.status : null)}
												onUploadSuccess={(url) => {
													setStatusImageUrl(url);
													setStatus(url);
													showSuccess("Gambar status berhasil diupload");
												}}
												onRemove={() => {
													setStatusImageUrl("");
													setStatus("");
												}}
											/>
										</div>
									)}
								</div>

								{/* Cover Image Section */}
								<div className="space-y-3">
									<label className="block text-sm font-semibold text-zinc-900">
										Cover Image
									</label>
									<p className="text-xs text-zinc-500 mb-3">Cover image akan ditampilkan di halaman explore dengan rasio 3:4</p>
									<div className="rounded-xl border-2 border-dashed border-zinc-200 p-6 bg-zinc-50/50">
										<CoverImageUpload
											currentCoverImageUrl={coverImageUrl || profile.coverImageUrl}
											onUploadSuccess={(url) => {
												setCoverImageUrl(url);
												showSuccess("Cover image berhasil diupload");
											}}
											onRemove={() => {
												setCoverImageUrl("");
											}}
										/>
									</div>
								</div>
							</div>
						)}

						{/* Submit Button */}
						<div className="pt-4 border-t border-zinc-200">
							<button 
								type="submit"
								disabled={pending}
								className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{pending ? (
									<span className="flex items-center justify-center gap-2">
										<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Menyimpan...
									</span>
								) : (
									"Simpan Perubahan"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}


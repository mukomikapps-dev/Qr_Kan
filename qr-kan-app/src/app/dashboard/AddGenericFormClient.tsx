"use client";
import { useMemo, useState, useEffect } from "react";
import { submitGenericBlock } from "./submitGenericAction";
import ImageUpload from "@/components/ImageUpload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faLink,
	faAlignLeft,
	faHashtag,
	faImage,
	faVideo,
	faCode,
	faShoppingCart,
	faHeading,
	faMinus,
	faShareNodes,
	faImages,
	faTrash,
	faPlus,
	faClock,
	faImages as faGallery,
	faFileText,
	faCrown,
	faLock,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

type CarouselItem = {
	imageUrl: string;
	title: string;
	url?: string;
	description?: string;
};

function CarouselItemManager({ onItemsChange }: { onItemsChange?: (count: number) => void }) {
	const [items, setItems] = useState<CarouselItem[]>([]);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formData, setFormData] = useState<CarouselItem>({
		imageUrl: "",
		title: "",
		url: "",
		description: "",
	});

	// Notify parent of items count change
	useEffect(() => {
		onItemsChange?.(items.length);
	}, [items.length, onItemsChange]);

	const handleAdd = () => {
		if (!formData.imageUrl || !formData.title) {
			alert("Image URL dan Title wajib diisi!");
			return;
		}
		setItems([...items, { ...formData }]);
		setFormData({ imageUrl: "", title: "", url: "", description: "" });
	};

	const handleEdit = (index: number) => {
		setEditingIndex(index);
		setFormData(items[index]);
	};

	const handleUpdate = () => {
		if (editingIndex === null || !formData.imageUrl || !formData.title) {
			alert("Image URL dan Title wajib diisi!");
			return;
		}
		const updated = [...items];
		updated[editingIndex] = { ...formData };
		setItems(updated);
		setEditingIndex(null);
		setFormData({ imageUrl: "", title: "", url: "", description: "" });
	};

	const handleDelete = (index: number) => {
		if (confirm("Hapus item ini?")) {
			setItems(items.filter((_, i) => i !== index));
		}
	};

	const handleCancel = () => {
		setEditingIndex(null);
		setFormData({ imageUrl: "", title: "", url: "", description: "" });
	};

	// Store items in hidden input
	useEffect(() => {
		const hiddenInput = document.querySelector('input[name="items"]') as HTMLInputElement;
		if (hiddenInput) {
			hiddenInput.value = JSON.stringify(items);
		}
	}, [items]);

	return (
		<div className="space-y-4">
			<input type="hidden" name="items" value={JSON.stringify(items)} />
			
			{/* Form untuk add/edit item */}
			<div className="rounded-lg border border-zinc-200 p-4 bg-zinc-50">
				<h4 className="font-medium mb-3">{editingIndex !== null ? "Edit Item" : "Tambah Item Baru"}</h4>
				<div className="space-y-3">
					<div>
						<label className="text-sm font-medium text-zinc-700">Image URL *</label>
						<input
							type="text"
							value={formData.imageUrl || ""}
							onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
							placeholder="https://..."
							className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							required
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-zinc-700">Title *</label>
						<input
							type="text"
							value={formData.title || ""}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							placeholder="Judul item"
							className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							required
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-zinc-700">URL (opsional)</label>
						<input
							type="text"
							value={formData.url || ""}
							onChange={(e) => setFormData({ ...formData, url: e.target.value })}
							placeholder="https://..."
							className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-zinc-700">Description (opsional)</label>
						<textarea
							value={formData.description || ""}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder="Deskripsi singkat"
							className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							rows={2}
						/>
					</div>
					<div className="flex gap-2">
						{editingIndex !== null ? (
							<>
								<button
									type="button"
									onClick={handleUpdate}
									className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
								>
									Update
								</button>
								<button
									type="button"
									onClick={handleCancel}
									className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
								>
									Batal
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={handleAdd}
								className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
							>
								<FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
								Tambah Item
							</button>
						)}
					</div>
				</div>
			</div>

			{/* List items */}
			{items.length > 0 && (
				<div className="space-y-2">
					<div className="text-sm font-medium text-zinc-700">Item Carousel ({items.length})</div>
					{items.map((item, index) => (
						<div key={index} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 bg-white">
							{item.imageUrl && (
								<img src={item.imageUrl} alt={item.title} className="h-16 w-16 rounded object-cover" />
							)}
							<div className="flex-1 min-w-0">
								<div className="font-medium text-sm truncate">{item.title}</div>
								{item.url && <div className="text-xs text-zinc-500 truncate">{item.url}</div>}
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => handleEdit(index)}
									className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
								>
									Edit
								</button>
								<button
									type="button"
									onClick={() => handleDelete(index)}
									className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
								>
									<FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function GalleryImageManager({ onImagesChange }: { onImagesChange?: (count: number) => void }) {
	const [images, setImages] = useState<string[]>([]);
	const [newImageUrl, setNewImageUrl] = useState("");

	const handleAdd = () => {
		if (!newImageUrl.trim()) {
			alert("Image URL wajib diisi!");
			return;
		}
		setImages([...images, newImageUrl.trim()]);
		setNewImageUrl("");
	};

	const handleDelete = (index: number) => {
		if (confirm("Hapus gambar ini?")) {
			setImages(images.filter((_, i) => i !== index));
		}
	};

	useEffect(() => {
		onImagesChange?.(images.length);
		const hiddenInput = document.querySelector('input[name="images"]') as HTMLInputElement;
		if (hiddenInput) {
			hiddenInput.value = JSON.stringify(images);
		}
	}, [images, onImagesChange]);

	return (
		<div className="space-y-4">
			<input type="hidden" name="images" value={JSON.stringify(images)} />
			
			<div className="rounded-lg border border-zinc-200 p-4 bg-zinc-50">
				<h4 className="font-medium mb-3">Tambah Gambar</h4>
				<div className="flex gap-2">
					<input
						type="text"
						value={newImageUrl}
						onChange={(e) => setNewImageUrl(e.target.value)}
						placeholder="https://..."
						className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
					/>
					<button
						type="button"
						onClick={handleAdd}
						className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 flex items-center gap-2"
					>
						<FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
						Tambah
					</button>
				</div>
			</div>

			{images.length > 0 && (
				<div className="space-y-2">
					<div className="text-sm font-medium text-zinc-700">Gambar Gallery ({images.length})</div>
					<div className="grid grid-cols-3 gap-3">
						{images.map((url, index) => (
							<div key={index} className="relative group">
								<img src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 rounded object-cover" />
								<button
									type="button"
									onClick={() => handleDelete(index)}
									className="absolute top-1 right-1 rounded-full bg-red-600 p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
								>
									<FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default function AddGenericFormClient({ username, isPro = false }: { username: string; isPro?: boolean }) {
	const [type, setType] = useState<string>("");
	const [imageUrl, setImageUrl] = useState<string>("");
	const [carouselItemsCount, setCarouselItemsCount] = useState<number>(0);
	const [galleryItemsCount, setGalleryItemsCount] = useState<number>(0);
	const [blockTab, setBlockTab] = useState<"free" | "pro">("free");
	const [countdownTargetDate, setCountdownTargetDate] = useState<string>("");
	const [richtextContent, setRichtextContent] = useState<string>("");

	// Reset fields when type changes
	useEffect(() => {
		if (type !== "image") {
			setImageUrl("");
		}
		if (type !== "countdown") {
			setCountdownTargetDate("");
		}
		if (type !== "richtext") {
			setRichtextContent("");
		}
		if (type !== "gallery") {
			setGalleryItemsCount(0);
		}
		if (type !== "carousel") {
			setCarouselItemsCount(0);
		}
	}, [type]);

	// Only render fields for the chosen type (hidden when not chosen)
	const renderFields = useMemo(() => {
		if (type === "link") {
			return (
				<>
					<div className="flex flex-col gap-2">
						<label className="text-sm">Judul</label>
						<input name="title" placeholder="Judul (untuk Link)" className="rounded border border-zinc-300 px-3 py-2" required />
						<label className="text-sm">URL</label>
						<input name="url" placeholder="https://..." className="rounded border border-zinc-300 px-3 py-2" required />
					</div>
				</>
			);
		}
		if (type === "heading") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">Heading Text</label>
					<input name="heading" placeholder="Judul Besar" className="rounded border border-zinc-300 px-3 py-2" required />
					<label className="text-sm">Size</label>
					<select name="size" className="rounded border border-zinc-300 px-3 py-2">
						<option value="large">Besar (H1)</option>
						<option value="medium">Sedang (H2)</option>
						<option value="small">Kecil (H3)</option>
					</select>
				</div>
			);
		}
		if (type === "text") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">Text</label>
					<input name="text" placeholder="Isi teks" className="rounded border border-zinc-300 px-3 py-2" required />
				</div>
			);
		}
		if (type === "htmltext") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">HTML Content</label>
					<textarea 
						name="htmlContent" 
						placeholder="<p>Teks dengan <strong>HTML</strong></p>" 
						className="rounded border border-zinc-300 px-3 py-2" 
						rows={4}
						required 
					/>
					<div className="text-xs text-zinc-500">
						Gunakan HTML tags: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;a&gt;, &lt;br&gt;, dll<br/>
						⚠️ Jangan gunakan &lt;html&gt;, &lt;body&gt;, atau DOCTYPE tags - hanya konten HTML saja
					</div>
				</div>
			);
		}
		if (type === "spacer") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">Tinggi Spacer (px)</label>
					<input 
						name="height" 
						type="number" 
						placeholder="40" 
						defaultValue="40"
						min="10"
						max="200"
						className="rounded border border-zinc-300 px-3 py-2" 
						required 
					/>
					<div className="text-xs text-zinc-500">Beri jarak vertikal antar blocks (10-200px)</div>
				</div>
			);
		}
		if (type === "social") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">Platform</label>
					<input name="platform" placeholder="instagram/tiktok/..." className="rounded border border-zinc-300 px-3 py-2" required />
					<label className="text-sm">Handle/Username</label>
					<input name="handle" placeholder="@nama" className="rounded border border-zinc-300 px-3 py-2" required />
				</div>
			);
		}
	if (type === "image") {
		return (
			<div className="flex flex-col gap-2">
				<ImageUpload 
					onUploadSuccess={(url) => setImageUrl(url)}
					currentImageUrl={imageUrl}
					onRemove={() => setImageUrl("")}
					aspectRatio={16 / 9}
				/>
				<input type="hidden" name="imageUrl" value={imageUrl || ""} />
				{!imageUrl && (
					<div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
						⚠️ Silakan upload image terlebih dahulu
					</div>
				)}
				<label className="text-sm">Alt Text (optional)</label>
				<input name="alt" placeholder="Description of image" className="rounded border border-zinc-300 px-3 py-2" />
			</div>
		);
	}
		if (type === "video") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">YouTube URL</label>
					<input 
						name="videoUrl" 
						placeholder="https://www.youtube.com/watch?v=..." 
						className="rounded border border-zinc-300 px-3 py-2" 
						required 
					/>
					<div className="text-xs text-zinc-500">Paste link YouTube video (contoh: youtube.com/watch?v=xxxxx atau youtu.be/xxxxx)</div>
				</div>
			);
		}
		if (type === "svg") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">SVG URL</label>
					<input name="svgUrl" placeholder="https://file.svg" className="rounded border border-zinc-300 px-3 py-2" required />
				</div>
			);
		}
		if (type === "whatsapp") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">WA Nomor</label>
					<input name="phone" placeholder="628xxx" className="rounded border border-zinc-300 px-3 py-2" required />
					<label className="text-sm">WA Pesan</label>
					<input name="message" placeholder="Halo..." className="rounded border border-zinc-300 px-3 py-2" />
				</div>
			);
		}
		if (type === "marketplace") {
			return (
				<div className="flex flex-col gap-2">
					<label className="text-sm">Platform</label>
					<input name="platform" placeholder="tokopedia/shopee/..." className="rounded border border-zinc-300 px-3 py-2" required />
					<label className="text-sm">URL</label>
					<input name="url" placeholder="https://produk..." className="rounded border border-zinc-300 px-3 py-2" required />
				</div>
			);
		}
		if (type === "carousel") {
			return (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-1">
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
							</svg>
							Fitur Pro - Carousel
						</div>
						<p className="text-xs text-amber-700">Tambahkan beberapa item untuk ditampilkan dalam carousel yang bisa di-swipe.</p>
					</div>
					<CarouselItemManager onItemsChange={(count) => setCarouselItemsCount(count)} />
				</div>
			);
		}
		if (type === "countdown") {
			return (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-1">
							<FontAwesomeIcon icon={faClock} className="h-4 w-4" />
							Fitur Pro - Countdown Timer
						</div>
						<p className="text-xs text-amber-700">Buat countdown timer untuk event atau promo terbatas waktu.</p>
					</div>
					<div className="space-y-3">
						<div>
							<label className="text-sm font-medium text-zinc-700">Judul (opsional)</label>
							<input
								name="title"
								type="text"
								placeholder="Event Spesial!"
								className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-zinc-700">Target Date & Time *</label>
							<input
								name="targetDate"
								type="datetime-local"
								required
								className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-zinc-700">Pesan Setelah Selesai (opsional)</label>
							<input
								name="message"
								type="text"
								placeholder="Event telah berakhir"
								className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							/>
						</div>
					</div>
				</div>
			);
		}
		if (type === "gallery") {
			return (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-1">
							<FontAwesomeIcon icon={faGallery} className="h-4 w-4" />
							Fitur Pro - Image Gallery
						</div>
						<p className="text-xs text-amber-700">Tambahkan beberapa gambar dalam gallery dengan lightbox.</p>
					</div>
					<GalleryImageManager onImagesChange={(count) => setGalleryItemsCount(count)} />
				</div>
			);
		}
		if (type === "richtext") {
			return (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-1">
							<FontAwesomeIcon icon={faFileText} className="h-4 w-4" />
							Fitur Pro - Rich Text Editor
						</div>
						<p className="text-xs text-amber-700">Editor teks dengan formatting (bold, italic, link, dll).</p>
					</div>
					<div>
						<label className="text-sm font-medium text-zinc-700">Konten *</label>
						<textarea
							name="content"
							value={richtextContent}
							onChange={(e) => setRichtextContent(e.target.value)}
							placeholder="Tulis konten dengan HTML formatting..."
							className="w-full rounded border border-zinc-300 px-3 py-2 text-sm mt-1"
							rows={8}
							required
						/>
						<p className="text-xs text-zinc-500 mt-1">
							Gunakan HTML tags: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;a href="..."&gt;link&lt;/a&gt;, &lt;br&gt;, dll
						</p>
					</div>
				</div>
			);
		}
		return null;
	}, [type, imageUrl]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		// Check if user is trying to add a pro block without pro subscription
		const proBlockTypes = ["carousel", "countdown", "gallery", "richtext"];
		if (proBlockTypes.includes(type) && !isPro) {
			alert("Fitur ini hanya tersedia untuk user Pro. Silakan upgrade ke Pro untuk menggunakan fitur ini.");
			return;
		}
		
		// Create FormData first
		const formData = new FormData(e.currentTarget);
		
		// Validate image type
		if (type === "image" && !imageUrl) {
			alert("Silakan upload image terlebih dahulu!");
			return;
		}
		
		// Validate carousel type
		if (type === "carousel") {
			const itemsInput = e.currentTarget.querySelector('input[name="items"]') as HTMLInputElement;
			if (itemsInput) {
				try {
					const items = JSON.parse(itemsInput.value || "[]");
					if (!Array.isArray(items) || items.length === 0) {
						alert("Carousel harus memiliki minimal 1 item!");
						return;
					}
				} catch {
					alert("Data carousel tidak valid!");
					return;
				}
			} else {
				alert("Carousel harus memiliki minimal 1 item!");
				return;
			}
		}
		
		// Validate gallery type
		if (type === "gallery") {
			const imagesInput = e.currentTarget.querySelector('input[name="images"]') as HTMLInputElement;
			if (imagesInput) {
				try {
					const images = JSON.parse(imagesInput.value || "[]");
					if (!Array.isArray(images) || images.length === 0) {
						alert("Gallery harus memiliki minimal 1 gambar!");
						return;
					}
				} catch {
					alert("Data gallery tidak valid!");
					return;
				}
			} else {
				alert("Gallery harus memiliki minimal 1 gambar!");
				return;
			}
		}
		
		// Validate countdown type
		if (type === "countdown") {
			const targetDate = formData.get("targetDate");
			if (!targetDate) {
				alert("Target date wajib diisi!");
				return;
			}
			const target = new Date(String(targetDate));
			if (target <= new Date()) {
				alert("Target date harus di masa depan!");
				return;
			}
		}
		
		// Validate richtext type
		if (type === "richtext") {
			const content = formData.get("content");
			if (!content || String(content).trim().length === 0) {
				alert("Konten wajib diisi!");
				return;
			}
		}
		
		// Ensure imageUrl is set for image type
		if (type === "image" && imageUrl) {
			formData.set("imageUrl", imageUrl);
		}
		
		// Submit form
		try {
			await submitGenericBlock(formData);
			// If successful, redirect will happen (no need to catch NEXT_REDIRECT)
		} catch (error: any) {
			// NEXT_REDIRECT is not a real error, it's how Next.js handles redirects
			if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
				// This is expected, redirect is happening
				return;
			}
			console.error("Submit error:", error);
			alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menambah blok");
		}
	};

	const blockTypes = [
		// Konten - Free
		{ type: "link", label: "Link", icon: faLink, group: "Konten", isPro: false },
		{ type: "heading", label: "Heading", icon: faHeading, group: "Konten", isPro: false },
		{ type: "text", label: "Text", icon: faAlignLeft, group: "Konten", isPro: false },
		{ type: "htmltext", label: "HTML", icon: faCode, group: "Konten", isPro: false },
		{ type: "spacer", label: "Spacer", icon: faMinus, group: "Konten", isPro: false },
		// Konten - Pro
		{ type: "countdown", label: "Countdown", icon: faClock, group: "Konten", isPro: true },
		{ type: "richtext", label: "Rich Text", icon: faFileText, group: "Konten", isPro: true },
		// Media - Free
		{ type: "image", label: "Image", icon: faImage, group: "Media", isPro: false },
		{ type: "video", label: "YouTube", icon: faVideo, group: "Media", isPro: false },
		{ type: "svg", label: "SVG", icon: faCode, group: "Media", isPro: false },
		// Media - Pro
		{ type: "carousel", label: "Carousel", icon: faImages, group: "Media", isPro: true },
		{ type: "gallery", label: "Gallery", icon: faGallery, group: "Media", isPro: true },
		// Komunikasi - Free
		{ type: "social", label: "Social", icon: faShareNodes, group: "Komunikasi", isPro: false },
		{ type: "whatsapp", label: "WhatsApp", icon: faWhatsapp, group: "Komunikasi", isPro: false },
		// E-commerce - Free
		{ type: "marketplace", label: "Marketplace", icon: faShoppingCart, group: "E-commerce", isPro: false },
	];

	return (
		<form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 p-4">
			<input type="hidden" name="username" value={username || ""} />
			<input type="hidden" name="type" value={type || ""} />
			
			<div className="mb-4">
				<div className="font-medium mb-1">Tambah Blok</div>
				<div className="text-xs text-zinc-500">Pilih jenis blok yang ingin ditambahkan</div>
			</div>

			{/* Block Type Selection - Tabs */}
			<div className="mb-6">
				{/* Tabs */}
				<div className="flex gap-2 mb-4 border-b border-zinc-200">
					<button
						type="button"
						onClick={() => {
							setBlockTab("free");
							setType(""); // Reset selection when switching tabs
						}}
						className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
							blockTab === "free"
								? "border-emerald-600 text-emerald-600"
								: "border-transparent text-zinc-500 hover:text-zinc-700"
						}`}
					>
						Free
					</button>
					<button
						type="button"
						onClick={() => {
							setBlockTab("pro");
							setType(""); // Reset selection when switching tabs
						}}
						className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
							blockTab === "pro"
								? "border-amber-600 text-amber-600"
								: "border-transparent text-zinc-500 hover:text-zinc-700"
						}`}
					>
						<FontAwesomeIcon icon={faCrown} className="h-3 w-3" />
						Pro
					</button>
				</div>

				{/* Icon Grid - Responsive: 3 cols on mobile, 4 cols on tablet, 6 cols on desktop */}
				<div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
					{blockTypes
						.filter(b => blockTab === "free" ? !b.isPro : b.isPro)
						.map((block) => {
							const isLocked = block.isPro && !isPro;
							return (
								<button
									key={block.type}
									type="button"
									onClick={() => {
										if (isLocked) {
											alert("Fitur ini hanya tersedia untuk user Pro. Silakan upgrade ke Pro untuk menggunakan fitur ini.");
											return;
										}
										setType(block.type);
									}}
									className={`relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-lg border-2 transition-all ${
										isLocked
											? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60"
											: type === block.type
												? block.isPro
													? "border-amber-600 bg-amber-50 text-amber-700"
													: "border-emerald-600 bg-emerald-50 text-emerald-700"
												: block.isPro
													? "border-amber-200 bg-amber-50/50 text-amber-700 hover:border-amber-300 hover:bg-amber-50 active:bg-amber-100"
													: "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100"
									}`}
									title={isLocked ? `${block.label} - Fitur Pro (Locked)` : block.label}
									disabled={isLocked}
								>
									{block.isPro && (
										<div className="absolute top-1 right-1">
											{isLocked ? (
												<FontAwesomeIcon icon={faLock} className="h-3 w-3 text-zinc-400" />
											) : (
												<FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-amber-600" />
											)}
										</div>
									)}
									<FontAwesomeIcon icon={block.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
									<span className="text-[11px] sm:text-xs font-medium text-center leading-tight px-0.5">{block.label}</span>
								</button>
							);
						})}
				</div>
			</div>

			{/* Conditionally rendered fields */}
			{renderFields ? (
				<div className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
					<div className="text-sm font-medium text-zinc-700 mb-3">Detail {type}</div>
					<div className="flex flex-col gap-3">{renderFields}</div>
				</div>
			) : null}
			
			<div>
				<button 
					type="submit"
					className="w-full rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-md shadow-emerald-600/30 hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed" 
					disabled={
						!type || 
						(type === "image" && !imageUrl) || 
						(type === "carousel" && carouselItemsCount === 0) ||
						(type === "gallery" && galleryItemsCount === 0) ||
						(type === "countdown" && !countdownTargetDate) ||
						(type === "richtext" && !richtextContent.trim())
					}
				>
					Tambah Blok
				</button>
			</div>
		</form>
	);
}



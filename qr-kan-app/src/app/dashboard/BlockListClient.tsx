"use client";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical, faEye, faEyeSlash, faTrash, faPen, faFloppyDisk, faXmark, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { reorderBlocksAction, toggleBlockVisibilityAction, deleteBlockAction, updateBlockDataAction, updateBlockScheduledDatesAction } from "./serverActions";
import VariantManager from "./VariantManager";
import ImageUpload from "@/components/ImageUpload";
import ScheduledContentEditor from "@/components/ScheduledContentEditor";

type BlockItem = {
	id: string;
	type: string;
	dataJson: string;
	order: number;
	isVisible: boolean;
	scheduledFrom?: string | null;
	scheduledTo?: string | null;
};

export default function BlockListClient({
	profileId,
	items,
}: {
	profileId: string;
	items: BlockItem[];
}) {
	const router = useRouter();
	const [list, setList] = useState(items.sort((a, b) => a.order - b.order));
	const [isPending, startTransition] = useTransition();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 200,
				tolerance: 5,
			},
		})
	);

	const ids = useMemo(() => list.map((i) => i.id), [list]);

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = ids.indexOf(active.id as string);
		const newIndex = ids.indexOf(over.id as string);
		const newList = arrayMove(list, oldIndex, newIndex).map((b, idx) => ({ ...b, order: idx }));
		setList(newList);
		startTransition(() => reorderBlocksAction(profileId, newList.map((b) => b.id)));
	}

	// Render without DnD on server, with DnD on client (prevent hydration mismatch)
	if (!isMounted) {
		return (
			<div className="space-y-3">
				{list.map((b) => (
					<Row
						key={b.id}
						id={b.id}
						block={b}
						onToggle={() =>
							startTransition(() => toggleBlockVisibilityAction(b.id, !b.isVisible))
						}
						onDelete={() => {
							if (confirm("Hapus blok ini?")) {
								startTransition(() => deleteBlockAction(b.id));
								setList((prev) => prev.filter((x) => x.id !== b.id));
							}
						}}
					/>
				))}
				{isPending ? <div className="text-xs text-zinc-500">Menyimpan…</div> : null}
			</div>
		);
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				<div className="space-y-3">
					{list.map((b) => (
						<Row
							key={b.id}
							id={b.id}
							block={b}
							onToggle={() =>
								startTransition(() => toggleBlockVisibilityAction(b.id, !b.isVisible))
							}
							onDelete={() => {
								if (confirm("Hapus blok ini?")) {
									startTransition(() => deleteBlockAction(b.id));
									setList((prev) => prev.filter((x) => x.id !== b.id));
								}
							}}
						/>
					))}
				</div>
			</SortableContext>
			{isPending ? <div className="text-xs text-zinc-500">Menyimpan…</div> : null}
		</DndContext>
	);
}

function Row({
	id,
	block,
	onToggle,
	onDelete,
}: {
	id: string;
	block: BlockItem;
	onToggle: () => void;
	onDelete: () => void;
}) {
	const router = useRouter();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1000 : 'auto',
	};
	const data = JSON.parse(block.dataJson);
	const [editing, setEditing] = useState(false);
	const [showAB, setShowAB] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [localData, setLocalData] = useState<any>(data);
	const title =
		block.type === "link"
			? data.title ?? "Link"
			: block.type === "heading"
			? String(data.heading ?? "Heading").slice(0, 40)
			: block.type === "text"
			// truncate
			? String(data.text ?? "").slice(0, 40)
			: block.type === "htmltext"
			? "HTML Text"
			: block.type === "spacer"
			? `Spacer (${data.height ?? "40"}px)`
			: block.type === "social"
			? `${data.platform ?? "social"}`
			: block.type === "video"
			? "YouTube Video"
			: block.type === "image"
			? "Gambar"
			: block.type === "svg"
			? "SVG"
			: block.type === "whatsapp"
			? "WhatsApp"
			: block.type === "marketplace"
			? data.platform ?? "Marketplace"
			: block.type;
	
	const supportsABTesting = block.type === "link";

	return (
		<div 
			ref={setNodeRef} 
			style={style} 
			className={`rounded-lg border border-zinc-200 bg-white ${isDragging ? 'shadow-xl' : ''}`}
		>
			<div className="flex items-center justify-between p-4">
				<div className="flex items-center gap-3">
					<div
						{...attributes}
						{...listeners}
						className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 p-2 -ml-2 rounded hover:bg-zinc-100 transition touch-none select-none"
						style={{ touchAction: 'none' }}
					>
						<FontAwesomeIcon icon={faGripVertical} className="text-lg pointer-events-none" />
					</div>
				<div>
					<div className="font-medium">{title}</div>
					<div className="text-xs text-zinc-500">{block.type === "video" ? "youtube" : block.type}</div>
				</div>
				</div>
				<div className="flex items-center gap-3">
					{editing ? (
						<button
							type="button"
							disabled={isSaving}
							onClick={async () => {
								try {
									setIsSaving(true);
									console.log("Saving block data:", localData);
									await updateBlockDataAction(block.id, localData);
									console.log("Block saved successfully");
									setEditing(false);
									router.refresh();
								} catch (error) {
									console.error("Error saving block:", error);
									alert("Error saving block: " + (error instanceof Error ? error.message : "Unknown error"));
								} finally {
									setIsSaving(false);
								}
							}}
							aria-label={isSaving ? "Menyimpan..." : "Simpan"}
							className={`${isSaving ? "opacity-50 cursor-not-allowed" : ""} text-blue-600 hover:text-blue-700`}
						>
							<FontAwesomeIcon icon={faFloppyDisk} />
						</button>
					) : null}
					{supportsABTesting ? (
						<button
							type="button"
							onClick={() => setShowAB((v) => !v)}
							aria-label="A/B Testing"
							className={showAB ? "text-emerald-600 hover:text-emerald-700" : "text-zinc-600 hover:text-zinc-800"}
						>
							<FontAwesomeIcon icon={faChartLine} />
						</button>
					) : null}
					<button
						type="button"
						onClick={() => setEditing((v) => !v)}
						aria-label={editing ? "Batal edit" : "Edit"}
						className="text-zinc-600 hover:text-zinc-800"
					>
						<FontAwesomeIcon icon={editing ? faXmark : faPen} />
					</button>
					<button
						type="button"
						onClick={onToggle}
						aria-label={block.isVisible ? "Sembunyikan" : "Tampilkan"}
						className="text-zinc-600 hover:text-zinc-800"
					>
						<FontAwesomeIcon icon={block.isVisible ? faEye : faEyeSlash} />
					</button>
					<button type="button" onClick={onDelete} aria-label="Hapus" className="text-red-600 hover:text-red-700">
						<FontAwesomeIcon icon={faTrash} />
					</button>
				</div>
			</div>
			{editing ? (
				<div className="border-t border-zinc-200 p-4 space-y-4">
					<EditorFields
						type={block.type}
						data={localData}
						onChange={setLocalData}
						onSave={async () => {
							try {
								setIsSaving(true);
								console.log("EditorFields saving block data:", localData);
								await updateBlockDataAction(block.id, localData);
								console.log("Block saved successfully from EditorFields");
								setEditing(false);
								router.refresh();
							} catch (error) {
								console.error("Error saving block from EditorFields:", error);
								alert("Error saving block: " + (error instanceof Error ? error.message : "Unknown error"));
								throw error;
							} finally {
								setIsSaving(false);
							}
						}}
						isSaving={isSaving}
					/>
					<ScheduledContentEditor
						scheduledFrom={block.scheduledFrom || null}
						scheduledTo={block.scheduledTo || null}
						onChange={async (from, to) => {
							await updateBlockScheduledDatesAction(block.id, from, to);
							router.refresh();
						}}
					/>
				</div>
			) : null}
			{showAB && supportsABTesting ? (
				<div className="border-t border-zinc-200 p-4">
					<VariantManager blockId={block.id} blockType={block.type} />
				</div>
			) : null}
		</div>
	);
}

function EditorFields({
	type,
	data,
	onChange,
	onSave,
	isSaving = false,
}: {
	type: string;
	data: any;
	onChange: (next: any) => void;
	onSave: () => void | Promise<void>;
	isSaving?: boolean;
}) {
	function input(name: string, placeholder: string, className = "w-full") {
		return (
			<input
				value={data?.[name] ?? ""}
				onChange={(e) => onChange({ ...data, [name]: e.target.value })}
				placeholder={placeholder}
				className={`${className} rounded border border-zinc-300 px-3 py-2 text-sm`}
			/>
		);
	}
	return (
		<div className="flex flex-col gap-3">
		{type === "link" ? (
			<div className="grid gap-3 sm:grid-cols-2">
				{input("title", "Judul")}
				{input("url", "https://...")}
			</div>
		) : null}
		{type === "heading" ? (
			<div className="flex flex-col gap-3">
				{input("heading", "Judul Besar")}
				<select
					value={data?.size ?? "large"}
					onChange={(e) => onChange({ ...data, size: e.target.value })}
					className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
				>
					<option value="large">Besar (H1)</option>
					<option value="medium">Sedang (H2)</option>
					<option value="small">Kecil (H3)</option>
				</select>
			</div>
		) : null}
		{type === "text" ? <div>{input("text", "Teks...")}</div> : null}
		{type === "htmltext" ? (
			<div className="flex flex-col gap-2">
				<textarea
					value={data?.htmlContent ?? ""}
					onChange={(e) => {
						const newData = { ...data, htmlContent: e.target.value };
						onChange(newData);
					}}
					placeholder="<p>HTML content...</p>"
					className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
					rows={4}
				/>
				<div className="text-xs text-zinc-500">
					Gunakan HTML tags: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;a&gt;, &lt;br&gt;, dll<br/>
					⚠️ Jangan gunakan &lt;html&gt;, &lt;body&gt;, atau DOCTYPE tags - hanya konten HTML saja
				</div>
			</div>
		) : null}
		{type === "spacer" ? (
			<div className="flex flex-col gap-2">
				<input
					type="number"
					value={data?.height ?? 40}
					onChange={(e) => onChange({ ...data, height: Number(e.target.value) })}
					placeholder="40"
					min="10"
					max="200"
					className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
				/>
				<div className="text-xs text-zinc-500">Tinggi spacer dalam pixel (10-200px)</div>
			</div>
		) : null}
		{type === "social" ? (
			<div className="grid gap-3 sm:grid-cols-2">
				{input("platform", "instagram/tiktok/...")}
				<div>
					<input
						value={data?.handle ? (data.handle.startsWith("@") ? data.handle : `@${data.handle}`) : ""}
						onChange={(e) => {
							let handle = e.target.value;
							// Allow user to type @, but we'll store it without @
							onChange({ ...data, handle });
						}}
						placeholder="@nama"
						className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
					/>
					<div className="text-xs text-zinc-500 mt-1">
						Handle akan disimpan tanpa @ prefix, tapi tetap tampil dengan @
					</div>
				</div>
			</div>
		) : null}
		{type === "image" ? (
			<div className="flex flex-col gap-3">
				<ImageUpload 
					onUploadSuccess={(url) => {
						onChange({ ...data, imageUrl: url });
					}}
					currentImageUrl={data?.imageUrl}
					onRemove={() => {
						onChange({ ...data, imageUrl: "" });
					}}
					aspectRatio={16 / 9}
				/>
				<div className="text-xs text-zinc-500 mb-2">Atau masukkan URL manual:</div>
				<input
					value={data?.imageUrl ?? ""}
					onChange={(e) => onChange({ ...data, imageUrl: e.target.value })}
					placeholder="https://gambar.jpg"
					className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
				/>
				<label className="text-sm font-medium">Alt Text (optional)</label>
				<input
					value={data?.alt ?? ""}
					onChange={(e) => onChange({ ...data, alt: e.target.value })}
					placeholder="deskripsi gambar"
					className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
				/>
			</div>
		) : null}
		{type === "video" ? (
			<div className="flex flex-col gap-2">
				{input("videoUrl", "https://www.youtube.com/watch?v=...")}
				<div className="text-xs text-zinc-500">YouTube URL (contoh: youtube.com/watch?v=xxxxx atau youtu.be/xxxxx)</div>
			</div>
		) : null}
			{type === "svg" ? <div>{input("svgUrl", "https://file.svg")}</div> : null}
			{type === "whatsapp" ? (
				<div className="grid gap-3 sm:grid-cols-2">
					{input("phone", "628xxx")}
					{input("message", "Pesan")}
				</div>
			) : null}
		{type === "marketplace" ? (
			<div className="grid gap-3 sm:grid-cols-2">
				{input("platform", "tokopedia/shopee/...")}
				{input("url", "https://produk...")}
			</div>
		) : null}
		{type === "countdown" ? (
			<div className="flex flex-col gap-3">
				{input("title", "Judul (opsional)", "w-full")}
				<div>
					<label className="text-sm font-medium text-zinc-700 mb-1 block">Target Date & Time *</label>
					<input
						type="datetime-local"
						value={data?.targetDate ? new Date(data.targetDate).toISOString().slice(0, 16) : ""}
						onChange={(e) => onChange({ ...data, targetDate: e.target.value })}
						className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
						required
					/>
				</div>
				{input("message", "Pesan Setelah Selesai (opsional)", "w-full")}
			</div>
		) : null}
		{type === "richtext" ? (
			<div className="flex flex-col gap-2">
				<textarea
					value={data?.content ?? ""}
					onChange={(e) => onChange({ ...data, content: e.target.value })}
					placeholder="Tulis konten dengan HTML formatting..."
					className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
					rows={8}
					required
				/>
				<div className="text-xs text-zinc-500">
					Gunakan HTML tags: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;a href="..."&gt;link&lt;/a&gt;, &lt;br&gt;, dll
				</div>
			</div>
		) : null}
		<div>
			<button
				type="button"
				disabled={isSaving}
				onClick={async () => {
					try {
						await onSave();
					} catch (error) {
						console.error("Error saving block:", error);
						alert("Error saving block: " + (error instanceof Error ? error.message : "Unknown error"));
					}
				}}
				className={`inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				<FontAwesomeIcon icon={faFloppyDisk} />
				{isSaving ? "Menyimpan..." : "Simpan"}
			</button>
		</div>
		</div>
	);
}



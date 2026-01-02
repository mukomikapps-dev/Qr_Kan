"use client";
import { useEffect, useState, useTransition } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faToggleOn, faToggleOff, faPen, faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons";
import { addVariantAction, updateVariantAction, deleteVariantAction, getVariantAnalyticsAction } from "./serverActions";

type Variant = {
	id: string;
	blockId: string;
	variantName: string;
	dataJson: string;
	trafficSplit: number;
	impressions: number;
	isActive: boolean;
	clicks?: number;
	ctr?: number;
};

export default function VariantManager({ blockId, blockType }: { blockId: string; blockType: string }) {
	const [variants, setVariants] = useState<Variant[]>([]);
	const [showAdd, setShowAdd] = useState(false);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		startTransition(async () => {
			const v = await getVariantAnalyticsAction(blockId);
			setVariants(v as any[]);
		});
	}, [blockId]);

	const totalSplit = variants.filter((v) => v.isActive).reduce((sum, v) => sum + v.trafficSplit, 0);

	return (
		<div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
			<div className="flex items-center justify-between">
				<div>
					<div className="font-medium text-sm">A/B Testing</div>
					<div className="text-xs text-zinc-500">
						{variants.length} variant{variants.length !== 1 ? "s" : ""} • Total: {totalSplit}%
					</div>
				</div>
				<button
					onClick={() => setShowAdd((v) => !v)}
					className="rounded bg-black px-3 py-1 text-xs text-white"
				>
					<FontAwesomeIcon icon={faPlus} className="mr-1" />
					Variant
				</button>
			</div>

			{showAdd ? (
				<AddVariantForm
					blockId={blockId}
					blockType={blockType}
					onAdded={() => {
						setShowAdd(false);
						startTransition(async () => {
							const v = await getVariantAnalyticsAction(blockId);
							setVariants(v as any[]);
						});
					}}
					onCancel={() => setShowAdd(false)}
				/>
			) : null}

			<div className="space-y-2">
				{variants.map((v) => (
					<VariantRow
						key={v.id}
						variant={v}
						blockType={blockType}
						onUpdated={() => {
							startTransition(async () => {
								const updated = await getVariantAnalyticsAction(blockId);
								setVariants(updated as any[]);
							});
						}}
						onDeleted={() => {
							startTransition(async () => {
								const updated = await getVariantAnalyticsAction(blockId);
								setVariants(updated as any[]);
							});
						}}
					/>
				))}
			</div>
			{isPending ? <div className="text-xs text-zinc-500">Loading...</div> : null}
		</div>
	);
}

function AddVariantForm({
	blockId,
	blockType,
	onAdded,
	onCancel,
}: {
	blockId: string;
	blockType: string;
	onAdded: () => void;
	onCancel: () => void;
}) {
	const [name, setName] = useState("");
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [split, setSplit] = useState(50);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		if (!name || !title || !url) return;
		startTransition(async () => {
			await addVariantAction(blockId, name, { title, url }, split);
			onAdded();
		});
	};

	return (
		<div className="space-y-2 rounded border border-zinc-300 bg-white p-3">
			<div className="text-xs font-medium">Tambah Variant</div>
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Nama variant (A, B, Control...)"
				className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
			/>
			{blockType === "link" ? (
				<>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Judul"
						className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
					/>
					<input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://..."
						className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
					/>
				</>
			) : null}
			<div className="flex items-center gap-2">
				<label className="text-xs">Traffic %</label>
				<input
					type="number"
					value={split}
					onChange={(e) => setSplit(Number(e.target.value))}
					min={0}
					max={100}
					className="w-20 rounded border border-zinc-300 px-2 py-1 text-xs"
				/>
			</div>
			<div className="flex gap-2">
				<button
					onClick={handleSubmit}
					disabled={isPending}
					className="rounded bg-black px-3 py-1 text-xs text-white"
				>
					Simpan
				</button>
				<button onClick={onCancel} className="rounded border px-3 py-1 text-xs">
					Batal
				</button>
			</div>
		</div>
	);
}

function VariantRow({
	variant,
	blockType,
	onUpdated,
	onDeleted,
}: {
	variant: Variant;
	blockType: string;
	onUpdated: () => void;
	onDeleted: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [localData, setLocalData] = useState<any>(JSON.parse(variant.dataJson));
	const [localSplit, setLocalSplit] = useState(variant.trafficSplit);
	const [isPending, startTransition] = useTransition();

	const data = JSON.parse(variant.dataJson);

	const handleToggle = () => {
		startTransition(async () => {
			await updateVariantAction(variant.id, { isActive: !variant.isActive });
			onUpdated();
		});
	};

	const handleSave = () => {
		startTransition(async () => {
			await updateVariantAction(variant.id, {
				data: localData,
				trafficSplit: localSplit,
			});
			setEditing(false);
			onUpdated();
		});
	};

	const handleDelete = () => {
		if (!confirm("Hapus variant ini?")) return;
		startTransition(async () => {
			await deleteVariantAction(variant.id);
			onDeleted();
		});
	};

	const clicks = variant.clicks || 0;
	const ctr = variant.ctr || 0;

	return (
		<div className="rounded border border-zinc-200 bg-white p-3">
			<div className="flex items-center justify-between mb-2">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<div className="text-xs font-medium">{variant.variantName}</div>
						<div className="text-xs text-zinc-500">
							{variant.trafficSplit}%
						</div>
					</div>
					{!editing ? (
						<div className="text-xs text-zinc-600">
							{blockType === "link" ? `${data.title} → ${data.url}` : JSON.stringify(data)}
						</div>
					) : null}
				</div>
				<div className="flex items-center gap-2">
					{editing ? (
						<button onClick={handleSave} className="text-blue-600 hover:text-blue-700">
							<FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
						</button>
					) : null}
					<button
						onClick={() => setEditing((v) => !v)}
						className="text-zinc-600 hover:text-zinc-800"
					>
						<FontAwesomeIcon icon={editing ? faXmark : faPen} className="text-xs" />
					</button>
					<button onClick={handleToggle} className="text-zinc-600 hover:text-zinc-800">
						<FontAwesomeIcon
							icon={variant.isActive ? faToggleOn : faToggleOff}
							className="text-xs"
						/>
					</button>
					<button onClick={handleDelete} className="text-red-600 hover:text-red-700">
						<FontAwesomeIcon icon={faTrash} className="text-xs" />
					</button>
				</div>
			</div>
			{editing ? (
				<div className="mt-2 space-y-2">
					{blockType === "link" ? (
						<>
							<input
								value={localData.title ?? ""}
								onChange={(e) => setLocalData({ ...localData, title: e.target.value })}
								placeholder="Judul"
								className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
							/>
							<input
								value={localData.url ?? ""}
								onChange={(e) => setLocalData({ ...localData, url: e.target.value })}
								placeholder="https://..."
								className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
							/>
						</>
					) : null}
					<div className="flex items-center gap-2">
						<label className="text-xs">Traffic %</label>
						<input
							type="number"
							value={localSplit}
							onChange={(e) => setLocalSplit(Number(e.target.value))}
							min={0}
							max={100}
							className="w-20 rounded border border-zinc-300 px-2 py-1 text-xs"
						/>
					</div>
				</div>
			) : null}
			{/* Analytics */}
			<div className="mt-2 grid grid-cols-3 gap-2 text-xs">
				<div className="rounded bg-zinc-50 p-2 text-center">
					<div className="text-zinc-500">Impressions</div>
					<div className="font-medium">{variant.impressions}</div>
				</div>
				<div className="rounded bg-zinc-50 p-2 text-center">
					<div className="text-zinc-500">Clicks</div>
					<div className="font-medium">{clicks}</div>
				</div>
				<div className="rounded bg-zinc-50 p-2 text-center">
					<div className="text-zinc-500">CTR</div>
					<div className="font-medium text-emerald-600">{ctr.toFixed(2)}%</div>
				</div>
			</div>
			{/* CTR Bar */}
			{ctr > 0 ? (
				<div className="mt-2">
					<div className="h-2 w-full rounded-full bg-zinc-200">
						<div
							className="h-full rounded-full bg-emerald-500"
							style={{ width: `${Math.min(ctr, 100)}%` }}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}


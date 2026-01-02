"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

type ScheduledContentEditorProps = {
	scheduledFrom: string | null;
	scheduledTo: string | null;
	onChange: (from: string | null, to: string | null) => void;
};

export default function ScheduledContentEditor({
	scheduledFrom,
	scheduledTo,
	onChange,
}: ScheduledContentEditorProps) {
	const [enabled, setEnabled] = useState(!!scheduledFrom || !!scheduledTo);
	const [from, setFrom] = useState(
		scheduledFrom ? new Date(scheduledFrom).toISOString().slice(0, 16) : ""
	);
	const [to, setTo] = useState(
		scheduledTo ? new Date(scheduledTo).toISOString().slice(0, 16) : ""
	);

	useEffect(() => {
		if (enabled) {
			onChange(from ? new Date(from).toISOString() : null, to ? new Date(to).toISOString() : null);
		} else {
			onChange(null, null);
		}
	}, [enabled, from, to, onChange]);

	return (
		<div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<FontAwesomeIcon icon={faClock} className="h-4 w-4 text-amber-700" />
					<span className="text-sm font-semibold text-amber-800">Scheduled Content (Pro)</span>
				</div>
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => setEnabled(e.target.checked)}
						className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
					/>
					<span className="text-xs text-amber-700">Enable</span>
				</label>
			</div>
			{enabled && (
				<div className="space-y-3 mt-3">
					<div>
						<label className="text-xs font-medium text-amber-800 block mb-1">Mulai Tampil</label>
						<input
							type="datetime-local"
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							className="w-full rounded border border-amber-300 px-3 py-2 text-sm bg-white"
						/>
						<p className="text-xs text-amber-600 mt-1">Kosongkan jika ingin langsung tampil</p>
					</div>
					<div>
						<label className="text-xs font-medium text-amber-800 block mb-1">Berakhir Tampil</label>
						<input
							type="datetime-local"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className="w-full rounded border border-amber-300 px-3 py-2 text-sm bg-white"
						/>
						<p className="text-xs text-amber-600 mt-1">Kosongkan jika ingin tampil selamanya</p>
					</div>
				</div>
			)}
		</div>
	);
}





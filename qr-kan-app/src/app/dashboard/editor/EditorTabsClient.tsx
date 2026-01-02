"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye } from "@fortawesome/free-solid-svg-icons";
import AddGenericFormClient from "../AddGenericFormClient";
import BlockListClient from "../BlockListClient";

type BlockItem = {
	id: string;
	type: string;
	dataJson: string;
	order: number;
	isVisible: boolean;
};

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

export default function EditorTabsClient({
	username,
	profileId,
	blocks,
	isPro = false,
}: {
	username: string;
	profileId: string;
	blocks: BlockItem[];
	isPro?: boolean;
}) {
	const [tab, setTab] = useState<"editor" | "preview">("editor");

	return (
		<div>
			<nav className="mb-6 overflow-x-auto border-b border-zinc-200 pb-4 scrollbar-hide">
				<div className="flex min-w-max gap-0.5">
					<Tab icon={faEdit} label="Editor" active={tab === "editor"} onClick={() => setTab("editor")} />
					<Tab icon={faEye} label="Preview" active={tab === "preview"} onClick={() => setTab("preview")} />
				</div>
			</nav>
			
			{tab === "editor" ? (
				<div className="space-y-6">
					<h2 className="ml-2 text-2xl font-bold text-zinc-900">Editor</h2>
					<AddGenericFormClient username={username} isPro={isPro} />
					<BlockListClient
						profileId={profileId}
						items={blocks}
					/>
				</div>
			) : null}
			
			{tab === "preview" ? (
				<div className="space-y-6">
					<h2 className="ml-2 text-2xl font-bold text-zinc-900">Preview</h2>
					<div className="rounded-lg border border-zinc-200">
						<iframe
							title="preview"
							src={`/@${username}`}
							className="h-[80vh] w-full rounded-lg"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}


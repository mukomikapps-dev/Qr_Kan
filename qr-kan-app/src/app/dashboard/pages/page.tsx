import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/user-helpers";
import { fetchUserProfiles } from "@/lib/profile-utils";
import LogoutButton from "@/components/LogoutButton";
import DashboardHeader from "@/components/DashboardHeader";
import MyPagesClient from "./MyPagesClient";

export const dynamic = "force-dynamic";

export default async function MyPagesPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const dbUser = await getOrCreateUser(user.id, user.email!);
	const profiles = await fetchUserProfiles(user.id);

	const isPro = !!dbUser?.isPro;

	return (
		<div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
			<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
				{/* Header */}
				<DashboardHeader
					title="My Pages"
					subtitle="Kelola semua halaman profil Anda"
					username={dbUser?.activeProfileId ? profiles.find((p) => p.id === dbUser.activeProfileId)?.username ?? profiles[0]?.username ?? "" : profiles[0]?.username ?? ""}
					profileList={profiles.map((p) => ({ id: p.id, username: p.username, displayName: p.displayName }))}
					activeProfileId={dbUser?.activeProfileId ?? null}
					logout={<LogoutButton className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm" />}
				/>

				{/* Main Content */}
				<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
					<MyPagesClient
						profiles={profiles.map((p) => ({
							id: p.id,
							username: p.username,
							displayName: p.displayName,
							avatarUrl: p.avatarUrl,
							createdAt: p.createdAt?.toISOString() ?? "",
						}))}
						activeProfileId={dbUser?.activeProfileId ?? null}
						isPro={isPro}
					/>
				</div>

				{/* Branding Footer */}
				<div className="fixed bottom-4 right-4 z-40">
					<a
						href="/"
						className="flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors shadow-sm"
						title="QR Kan - Digital Profile Builder"
					>
						<span>Powered by</span>
						<span className="font-semibold text-emerald-600">QR Kan</span>
					</a>
				</div>
			</div>
		</div>
	);
}
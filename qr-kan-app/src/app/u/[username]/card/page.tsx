import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import PrintButton from "./print-button";

export default async function CardPage(context: { params: Promise<{ username: string }> }) {
	const { username } = await context.params;
	const normalized = username.toLowerCase();
	
	let profile: any;
	try {
		profile = (await db.select().from(profiles).where(eq(profiles.username, normalized)))[0];
	} catch (error: any) {
		// If category column doesn't exist yet, select without it
		if (error?.message?.includes('category') || error?.code === '42703') {
			profile = (await db
				.select({
					id: profiles.id,
					userId: profiles.userId,
					username: profiles.username,
					displayName: profiles.displayName,
					bio: profiles.bio,
					avatarUrl: profiles.avatarUrl,
					logoUrl: profiles.logoUrl,
					bgType: profiles.bgType,
					bgSolidColor: profiles.bgSolidColor,
					bgImageUrl: profiles.bgImageUrl,
					bgPatternId: profiles.bgPatternId,
					bgGradientColors: profiles.bgGradientColors,
					showAvatar: profiles.showAvatar,
					showDisplayName: profiles.showDisplayName,
					showBio: profiles.showBio,
					showLogo: profiles.showLogo,
					showQr: profiles.showQr,
					showIcons: profiles.showIcons,
					stickyHeaderBg: profiles.stickyHeaderBg,
					themePresetId: profiles.themePresetId,
					themeJson: profiles.themeJson,
					useCustomColors: profiles.useCustomColors,
					customColors: profiles.customColors,
					detailedColors: profiles.detailedColors,
					status: profiles.status,
					statusType: profiles.statusType,
					coverImageUrl: profiles.coverImageUrl,
					createdAt: profiles.createdAt,
				})
				.from(profiles)
				.where(eq(profiles.username, normalized)))[0];
		} else {
			throw error;
		}
	}
	
	if (!profile) return notFound();

	return (
		<html>
			<head>
				<title>{`Kartu Nama @${profile.username}`}</title>
			</head>
			<body className="bg-white text-black">
				<div className="mx-auto my-10 w-[340px] rounded-2xl border border-zinc-200 p-6 shadow">
					<img src={profile.logoUrl || "/default-logo.svg"} alt="logo" className="mx-auto mb-3 h-12 object-contain" />
					<div className="text-center">
						<div className="text-lg font-semibold">{profile.displayName}</div>
						<div className="text-sm text-zinc-600">@{profile.username}</div>
					</div>
					<div className="mt-4 flex justify-center">
						<img
							src={`/api/qr/${encodeURIComponent(profile.username)}?format=png`}
							alt="QR"
							className="h-40 w-40"
						/>
					</div>
					{profile.bio ? <div className="mt-3 text-center text-sm text-zinc-600">{profile.bio}</div> : null}
					<div className="mt-5 flex justify-center">
						<PrintButton />
					</div>
				</div>
			</body>
		</html>
	);
}



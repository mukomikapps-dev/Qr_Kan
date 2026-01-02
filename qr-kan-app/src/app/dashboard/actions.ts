import { db } from "@/db/client";
import { blocks, profiles } from "@/db/schema";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper function to revalidate all related paths
async function revalidatePublicProfile(username: string) {
	revalidatePath("/dashboard");
	revalidatePath(`/u/${username}`);
	revalidatePath(`/@${username}`);
}

async function revalidatePublicProfileByBlockId(blockId: string) {
	const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
	if (!block) return;
	const profile = await db.select().from(profiles).where(eq(profiles.id, block.profileId)).then(r => r[0]);
	if (!profile) return;
	await revalidatePublicProfile(profile.username);
}

type NewBlockType =
	| "link"
	| "text"
	| "heading"
	| "htmltext"
	| "spacer"
	| "social"
	| "image"
	| "video"
	| "svg"
	| "whatsapp"
	| "marketplace"
	| "carousel"
	| "countdown"
	| "gallery"
	| "richtext";

export async function addLinkBlock(username: string, title: string, url: string) {
	// Get profile with fallback for missing columns
	let profile: any;
	try {
		profile = (await db.select().from(profiles).where(eq(profiles.username, username)))[0];
	} catch (error: any) {
		// If columns don't exist, select only basic columns
		if (error?.message?.includes('category') || error?.message?.includes('status') || error?.message?.includes('cover_image_url') || error?.code === '42703') {
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
					createdAt: profiles.createdAt,
				})
				.from(profiles)
				.where(eq(profiles.username, username)))[0];
		} else {
			throw error;
		}
	}
	if (!profile) throw new Error("Profile not found");
	const maxOrder =
		(
			await db
				.select({ order: blocks.order })
				.from(blocks)
				.where(eq(blocks.profileId, profile.id))
		).map((b: { order: number }) => b.order).sort((a: number, b: number) => b - a)[0] ?? -1;
	await db.insert(blocks).values({
		id: randomUUID(),
		profileId: profile.id,
		type: "link",
		dataJson: JSON.stringify({ title, url }),
		order: maxOrder + 1,
		isVisible: true,
	});
	revalidatePath("/dashboard");
	revalidatePath(`/u/${username}`);
	revalidatePath(`/@${username}`);
}

export async function addGenericBlock(
	username: string,
	type: NewBlockType,
	fields: Record<string, string>
) {
	// Get profile with fallback for missing columns
	let profile: any;
	try {
		profile = (await db.select().from(profiles).where(eq(profiles.username, username)))[0];
	} catch (error: any) {
		// If columns don't exist, select only basic columns
		if (error?.message?.includes('category') || error?.message?.includes('status') || error?.message?.includes('cover_image_url') || error?.code === '42703') {
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
					createdAt: profiles.createdAt,
				})
				.from(profiles)
				.where(eq(profiles.username, username)))[0];
		} else {
			throw error;
		}
	}
	if (!profile) throw new Error("Profile not found");
	const maxOrder =
		(
			await db
				.select({ order: blocks.order })
				.from(blocks)
				.where(eq(blocks.profileId, profile.id))
		).map((b: { order: number }) => b.order).sort((a: number, b: number) => b - a)[0] ?? -1;

	// Normalize data per type
	let data: any = {};
	if (type === "link") {
		data = { title: fields.title, url: fields.url };
	} else if (type === "text") {
		data = { text: fields.text };
	} else if (type === "heading") {
		data = { heading: fields.heading, size: fields.size ?? "large" };
	} else if (type === "htmltext") {
		data = { htmlContent: fields.htmlContent };
	} else if (type === "spacer") {
		data = { height: Number(fields.height) || 40 };
	} else if (type === "social") {
		data = { platform: fields.platform, handle: fields.handle, url: buildSocialUrl(fields) };
	} else if (type === "image") {
		data = { imageUrl: fields.imageUrl, alt: fields.alt ?? "" };
	} else if (type === "video") {
		data = { videoUrl: fields.videoUrl, posterUrl: fields.posterUrl ?? "" };
	} else if (type === "svg") {
		data = { svgUrl: fields.svgUrl };
	} else if (type === "whatsapp") {
		const url = buildWhatsappUrl(fields.phone ?? "", fields.message ?? "");
		data = { phone: fields.phone, message: fields.message ?? "", url };
	} else if (type === "marketplace") {
		data = { platform: fields.platform, url: fields.url };
	} else if (type === "carousel") {
		// Carousel items are passed as JSON string
		const itemsJson = fields.items || "[]";
		try {
			const items = JSON.parse(itemsJson);
			data = { items: Array.isArray(items) ? items : [] };
		} catch {
			data = { items: [] };
		}
	} else if (type === "countdown") {
		const targetDate = fields.targetDate || "";
		const title = fields.title || "";
		const message = fields.message || "";
		data = { targetDate, title, message };
	} else if (type === "gallery") {
		// Gallery images are passed as JSON string
		const imagesJson = fields.images || "[]";
		try {
			const images = JSON.parse(imagesJson);
			data = { images: Array.isArray(images) ? images : [] };
		} catch {
			data = { images: [] };
		}
	} else if (type === "richtext") {
		data = { content: fields.content || "" };
	}

	await db.insert(blocks).values({
		id: randomUUID(),
		profileId: profile.id,
		type,
		dataJson: JSON.stringify(data),
		order: maxOrder + 1,
		isVisible: true,
	});
	revalidatePath("/dashboard");
	revalidatePath(`/u/${username}`);
	revalidatePath(`/@${username}`);
}

function buildWhatsappUrl(phone: string, message: string) {
	const p = phone.replace(/[^0-9]/g, "");
	const msg = encodeURIComponent(message ?? "");
	return msg ? `https://wa.me/${p}?text=${msg}` : `https://wa.me/${p}`;
}

function buildSocialUrl(fields: Record<string, string>) {
	const platform = (fields.platform ?? "").toLowerCase();
	let handle = fields.handle ?? "";
	
	// Remove @ prefix if present (user might input @username)
	handle = handle.replace(/^@+/, "");
	
	// URL encode the handle to preserve special characters like underscore
	// But don't encode if it's already a valid URL path segment
	const encodedHandle = encodeURIComponent(handle);
	
	if (platform === "instagram") return `https://instagram.com/${encodedHandle}`;
	if (platform === "tiktok") return `https://tiktok.com/@${encodedHandle}`;
	if (platform === "twitter" || platform === "x") return `https://x.com/${encodedHandle}`;
	if (platform === "youtube") return `https://youtube.com/@${encodedHandle}`;
	return "#";
}

export async function toggleBlockVisibility(blockId: string, visible: boolean) {
	await db.update(blocks).set({ isVisible: visible }).where(eq(blocks.id, blockId));
	await revalidatePublicProfileByBlockId(blockId);
}

export async function moveBlock(blockId: string, direction: "up" | "down") {
	const current = (await db.select().from(blocks).where(eq(blocks.id, blockId)))[0];
	if (!current) return;
	const siblings = await db
		.select()
		.from(blocks)
		.where(eq(blocks.profileId, current.profileId));
	const sorted = siblings.sort((a: any, b: any) => a.order - b.order);
	const index = sorted.findIndex((b: any) => b.id === blockId);
	const swapIndex = direction === "up" ? index - 1 : index + 1;
	if (swapIndex < 0 || swapIndex >= sorted.length) return;
	const other = sorted[swapIndex];
	await db.update(blocks).set({ order: other.order }).where(eq(blocks.id, current.id));
	await db.update(blocks).set({ order: current.order }).where(eq(blocks.id, other.id));
	await revalidatePublicProfileByBlockId(blockId);
}

export async function deleteBlock(blockId: string) {
	// Get profile info before deleting for revalidation
	const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
	const profile = block ? await db.select().from(profiles).where(eq(profiles.id, block.profileId)).then(r => r[0]) : null;
	
	await db.delete(blocks).where(eq(blocks.id, blockId));
	
	if (profile) {
		await revalidatePublicProfile(profile.username);
	}
}

export async function updateLinkBlock(blockId: string, title: string, url: string) {
	const record = (await db.select().from(blocks).where(eq(blocks.id, blockId)))[0];
	if (!record) return;
	if (record.type !== "link") return;
	await db
		.update(blocks)
		.set({ dataJson: JSON.stringify({ title, url }) })
		.where(eq(blocks.id, blockId));
	await revalidatePublicProfileByBlockId(blockId);
}

export async function addTextBlock(username: string, text: string) {
	const profile = (await db.select().from(profiles).where(eq(profiles.username, username)))[0];
	if (!profile) throw new Error("Profile not found");
	const maxOrder =
		(
			await db
				.select({ order: blocks.order })
				.from(blocks)
				.where(eq(blocks.profileId, profile.id))
		).map((b: { order: number }) => b.order).sort((a: number, b: number) => b - a)[0] ?? -1;
	await db.insert(blocks).values({
		id: randomUUID(),
		profileId: profile.id,
		type: "text",
		dataJson: JSON.stringify({ text }),
		order: maxOrder + 1,
		isVisible: true,
	});
	revalidatePath("/dashboard");
	revalidatePath(`/u/${username}`);
	revalidatePath(`/@${username}`);
}

export async function updateTextBlock(blockId: string, text: string) {
	const record = (await db.select().from(blocks).where(eq(blocks.id, blockId)))[0];
	if (!record) return;
	if (record.type !== "text") return;
	await db.update(blocks).set({ dataJson: JSON.stringify({ text }) }).where(eq(blocks.id, blockId));
	await revalidatePublicProfileByBlockId(blockId);
}

export async function addSocialBlock(username: string, platform: string, handle: string) {
	const profile = (await db.select().from(profiles).where(eq(profiles.username, username)))[0];
	if (!profile) throw new Error("Profile not found");
	const maxOrder =
		(
			await db
				.select({ order: blocks.order })
				.from(blocks)
				.where(eq(blocks.profileId, profile.id))
		).map((b: { order: number }) => b.order).sort((a: number, b: number) => b - a)[0] ?? -1;
	await db.insert(blocks).values({
		id: randomUUID(),
		profileId: profile.id,
		type: "social",
		dataJson: JSON.stringify({ platform, handle }),
		order: maxOrder + 1,
		isVisible: true,
	});
	revalidatePath("/dashboard");
	revalidatePath(`/u/${username}`);
	revalidatePath(`/@${username}`);
}

export async function updateSocialBlock(blockId: string, platform: string, handle: string) {
	const record = (await db.select().from(blocks).where(eq(blocks.id, blockId)))[0];
	if (!record) return;
	if (record.type !== "social") return;
	await db
		.update(blocks)
		.set({ dataJson: JSON.stringify({ platform, handle }) })
		.where(eq(blocks.id, blockId));
	await revalidatePublicProfileByBlockId(blockId);
}



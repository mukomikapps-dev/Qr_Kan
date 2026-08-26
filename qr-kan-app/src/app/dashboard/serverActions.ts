"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { blocks, profiles, blockVariants, clicks, users, visits, profileCategories } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import postgres from "postgres";

// Helper function to safely select profile (handles missing columns gracefully)
async function getProfileSafe(profileId: string) {
	try {
		return await db.select().from(profiles).where(eq(profiles.id, profileId)).then(r => r[0]);
	} catch (error: any) {
		// If category column doesn't exist, select without it
		if (error?.message?.includes('category') || error?.code === '42703') {
			return await db.select({
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
			}).from(profiles).where(eq(profiles.id, profileId)).then(r => r[0]);
		}
		throw error;
	}
}

// Helper function to revalidate all related paths
async function revalidatePublicProfile(username: string) {
	revalidatePath("/dashboard");
	revalidatePath(`/u/${username}`);
	revalidatePath(`/@${username}`);
}

async function revalidatePublicProfileByBlockId(blockId: string) {
	const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
	if (!block) return;
	const profile = await getProfileSafe(block.profileId);
	if (!profile) return;
	await revalidatePublicProfile(profile.username);
}

async function revalidatePublicProfileByProfileId(profileId: string) {
	const profile = await getProfileSafe(profileId);
	if (!profile) return;
	await revalidatePublicProfile(profile.username);
}

export async function reorderBlocksAction(profileId: string, orderedIds: string[]) {
	try {
		// Verify user is authenticated and owns the profile
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			throw new Error("Unauthorized");
		}

		const profile = await getProfileSafe(profileId);
		if (!profile || profile.userId !== user.id) {
			throw new Error("Unauthorized: User does not own this profile");
		}

		for (let i = 0; i < orderedIds.length; i++) {
			await db.update(blocks).set({ order: i }).where(eq(blocks.id, orderedIds[i]));
		}
		await revalidatePublicProfileByProfileId(profileId);
	} catch (error: any) {
		console.error("Error reordering blocks:", error);
		throw error;
	}
}

export async function toggleBlockVisibilityAction(blockId: string, visible: boolean) {
	try {
		// Verify user is authenticated
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			throw new Error("Unauthorized");
		}

		// Get block and verify user owns it
		const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
		if (!block) {
			throw new Error("Block not found");
		}

		const profile = await getProfileSafe(block.profileId);
		if (!profile || profile.userId !== user.id) {
			throw new Error("Unauthorized: User does not own this block");
		}

		await db.update(blocks).set({ isVisible: visible }).where(eq(blocks.id, blockId));
		await revalidatePublicProfileByBlockId(blockId);
	} catch (error: any) {
		console.error("Error toggling block visibility:", error);
		throw error;
	}
}

export async function deleteBlockAction(blockId: string) {
	try {
		// Verify user is authenticated
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			throw new Error("Unauthorized");
		}

		// Get block and verify it exists
		const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
		if (!block) {
			throw new Error("Block not found");
		}

		// Get profile and verify user owns it
		const profile = await getProfileSafe(block.profileId);
		if (!profile || profile.userId !== user.id) {
			throw new Error("Unauthorized: User does not own this block");
		}
		
		// Delete in order to handle foreign key constraints:
		// 1. Delete all clicks for this block
		await db.delete(clicks).where(eq(clicks.blockId, blockId));
		// 2. Delete all variants for this block
		await db.delete(blockVariants).where(eq(blockVariants.blockId, blockId));
		// 3. Finally delete the block itself
		await db.delete(blocks).where(eq(blocks.id, blockId));
		
		if (profile) {
			await revalidatePublicProfile(profile.username);
		}
	} catch (error: any) {
		console.error("Error deleting block:", error);
		throw error;
	}
}

export async function updateBlockScheduledDatesAction(
	blockId: string,
	scheduledFrom: string | null,
	scheduledTo: string | null
) {
	try {
		// Verify user is authenticated
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			throw new Error("Unauthorized");
		}

		// Get block and verify user owns it
		const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
		if (!block) {
			throw new Error("Block not found");
		}

		const profile = await getProfileSafe(block.profileId);
		if (!profile || profile.userId !== user.id) {
			throw new Error("Unauthorized: User does not own this block");
		}

		const from = scheduledFrom ? new Date(scheduledFrom) : null;
		const to = scheduledTo ? new Date(scheduledTo) : null;
		
		await db.update(blocks).set({
			scheduledFrom: from,
			scheduledTo: to,
		}).where(eq(blocks.id, blockId));
		
		await revalidatePublicProfileByBlockId(blockId);
	} catch (error: any) {
		console.error("Error updating block scheduled dates:", error);
		throw error;
	}
}

export async function updateBlockDataAction(blockId: string, data: Record<string, unknown>) {
	try {
		// Verify user is authenticated
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			throw new Error("Unauthorized");
		}

		// Get block and verify user owns it
		const block = await db.select().from(blocks).where(eq(blocks.id, blockId)).then(r => r[0]);
		if (!block) {
			throw new Error("Block not found");
		}

		const profile = await getProfileSafe(block.profileId);
		if (!profile || profile.userId !== user.id) {
			throw new Error("Unauthorized: User does not own this block");
		}
		
		// Log the block type and data for debugging
		console.log(`[updateBlockDataAction] Block type: ${block.type}, Block ID: ${blockId}`, data);
		
		// If social block, rebuild URL from platform and handle
		if (block?.type === "social" && data.platform && data.handle) {
			const platform = String(data.platform).toLowerCase();
			let handle = String(data.handle);
			
			// Remove @ prefix if present (but preserve the handle as-is for storage)
			const cleanHandle = handle.replace(/^@+/, "");
			
			// Store handle without @ prefix (but with underscore preserved)
			data.handle = cleanHandle;
			
			// URL encode the handle to preserve special characters like underscore
			const encodedHandle = encodeURIComponent(cleanHandle);
			
			let url = "#";
			if (platform === "instagram") url = `https://instagram.com/${encodedHandle}`;
			else if (platform === "tiktok") url = `https://tiktok.com/@${encodedHandle}`;
			else if (platform === "twitter" || platform === "x") url = `https://x.com/${encodedHandle}`;
			else if (platform === "youtube") url = `https://youtube.com/@${encodedHandle}`;
			
			// Update data with rebuilt URL and cleaned handle
			data.url = url;
			data.platform = platform; // Ensure platform is lowercase
		}
		
		// If WhatsApp block, rebuild URL from phone and message
		if (block?.type === "whatsapp" && data.phone) {
			const phone = String(data.phone);
			const message = String(data.message || "");
			
			// Clean phone number (remove non-digits)
			const cleanPhone = phone.replace(/[^0-9]/g, "");
			
			// Store cleaned phone
			data.phone = cleanPhone;
			
			// Build WhatsApp URL
			const encodedMessage = encodeURIComponent(message);
			const url = message 
				? `https://wa.me/${cleanPhone}?text=${encodedMessage}` 
				: `https://wa.me/${cleanPhone}`;
			
			// Update data with rebuilt URL
			data.url = url;
		}
		
		const serializedData = JSON.stringify(data);
		console.log(`[updateBlockDataAction] Serialized data: ${serializedData.substring(0, 100)}...`);
		
		await db
			.update(blocks)
			.set({ dataJson: serializedData })
			.where(eq(blocks.id, blockId));
		
		console.log(`[updateBlockDataAction] Block updated successfully, revalidating...`);
		revalidatePath("/dashboard");
		await revalidatePublicProfileByBlockId(blockId);
		console.log(`[updateBlockDataAction] Revalidation completed`);
	} catch (error: any) {
		console.error("Error updating block data:", error);
		throw error;
	}
}

export async function updateProfileAction(
	profileId: string,
	fields: {
		displayName?: string;
		bio?: string;
		avatarUrl?: string;
		logoUrl?: string;
		bgType?: string;
		bgSolidColor?: string;
		bgImageUrl?: string;
		bgPatternId?: string;
		bgGradientColors?: string;
		showAvatar?: boolean;
		showDisplayName?: boolean;
		showBio?: boolean;
		showLogo?: boolean;
		showQr?: boolean;
		showIcons?: boolean;
		stickyHeaderBg?: boolean;
		themePresetId?: string;
		themeJson?: string;
		useCustomColors?: boolean;
		customColors?: string;
		detailedColors?: string;
		status?: string;
		statusType?: string;
		coverImageUrl?: string;
		category?: string | null;
	}
) {
	try {
		// Build payload with only defined fields to avoid overwriting with undefined
		const payload: Record<string, any> = {};
	
	console.log("updateProfileAction called with fields:", {
		displayName: fields.displayName,
		bio: fields.bio ? fields.bio.substring(0, 50) + "..." : fields.bio,
		avatarUrl: fields.avatarUrl ? fields.avatarUrl.substring(0, 50) + "..." : fields.avatarUrl,
		logoUrl: fields.logoUrl,
		coverImageUrl: fields.coverImageUrl ? fields.coverImageUrl.substring(0, 50) + "..." : fields.coverImageUrl,
		status: fields.status ? fields.status.substring(0, 50) + "..." : fields.status,
		category: fields.category,
	});
	
	if (fields.displayName !== undefined) payload.displayName = fields.displayName;
	if (fields.bio !== undefined) payload.bio = fields.bio;
	if (fields.avatarUrl !== undefined) payload.avatarUrl = fields.avatarUrl;
	if (fields.logoUrl !== undefined) payload.logoUrl = fields.logoUrl;
	if (fields.bgType !== undefined) payload.bgType = fields.bgType;
	if (fields.bgSolidColor !== undefined) payload.bgSolidColor = fields.bgSolidColor;
	if (fields.bgImageUrl !== undefined) payload.bgImageUrl = fields.bgImageUrl;
	if (fields.bgPatternId !== undefined) payload.bgPatternId = fields.bgPatternId;
	if (fields.bgGradientColors !== undefined) payload.bgGradientColors = fields.bgGradientColors;
	if (fields.showAvatar !== undefined) payload.showAvatar = fields.showAvatar;
	if (fields.showDisplayName !== undefined) payload.showDisplayName = fields.showDisplayName;
	if (fields.showBio !== undefined) payload.showBio = fields.showBio;
	if (fields.showLogo !== undefined) payload.showLogo = fields.showLogo;
	if (fields.showQr !== undefined) payload.showQr = fields.showQr;
	if (fields.showIcons !== undefined) payload.showIcons = fields.showIcons;
	if (fields.stickyHeaderBg !== undefined) payload.stickyHeaderBg = fields.stickyHeaderBg;
	if (fields.themePresetId !== undefined) payload.themePresetId = fields.themePresetId;
	if (fields.themeJson !== undefined) payload.themeJson = fields.themeJson;
	if (fields.useCustomColors !== undefined) payload.useCustomColors = fields.useCustomColors;
	if (fields.customColors !== undefined) payload.customColors = fields.customColors;
	if (fields.detailedColors !== undefined) payload.detailedColors = fields.detailedColors;
	// Convert empty strings to null for status, coverImageUrl, and category to properly clear values
	if (fields.status !== undefined) payload.status = fields.status === "" ? null : fields.status;
	if (fields.statusType !== undefined) payload.statusType = fields.statusType === "" ? "text" : fields.statusType;
	
	// Handle coverImageUrl - CRITICAL: This must be included if provided
	console.log("Checking coverImageUrl:", {
		hasField: fields.coverImageUrl !== undefined,
		value: fields.coverImageUrl ? fields.coverImageUrl.substring(0, 100) + "..." : fields.coverImageUrl,
		type: typeof fields.coverImageUrl,
	});
	
	if (fields.coverImageUrl !== undefined) {
		// Only set to null if explicitly empty string, otherwise preserve the value (even if it's a valid URL)
		if (fields.coverImageUrl === "" || fields.coverImageUrl === null) {
			payload.coverImageUrl = null;
			console.log("coverImageUrl field received: empty/null, setting to null");
		} else {
			payload.coverImageUrl = fields.coverImageUrl;
			console.log("✅ coverImageUrl added to payload:", fields.coverImageUrl.substring(0, 100) + "...");
		}
	} else {
		console.warn("⚠️ coverImageUrl is undefined in fields - NOT adding to payload");
	}
	
	// Extract category value before adding to payload (we'll save it separately to profile_categories)
	// Category is NOT stored in profiles table, it's stored in profile_categories table
	const categoryValue = fields.category !== undefined ? (fields.category === "" ? null : fields.category) : undefined;
	
	// Log payload to verify coverImageUrl is included
	console.log("Payload keys before update:", Object.keys(payload));
	if (payload.coverImageUrl) {
		console.log("✅ coverImageUrl is in payload:", payload.coverImageUrl.substring(0, 100) + "...");
	} else {
		console.warn("⚠️ coverImageUrl is NOT in payload or is null/empty");
	}
	
	// If no fields to update (excluding category), return early
	if (Object.keys(payload).length === 0 && categoryValue === undefined) return;
	
	// Get username for revalidation (with fallback for status columns)
	let profile: any;
	try {
		profile = await db.select().from(profiles).where(eq(profiles.id, profileId)).then(r => r[0]);
	} catch (error: any) {
		console.warn("Error selecting profile for revalidation:", error?.message);
		// If status, coverImageUrl, or category columns don't exist yet, select without them
		if (error?.message?.includes('status') || error?.message?.includes('cover_image_url') || error?.message?.includes('category') || error?.code === '42703') {
			try {
				profile = await db
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
					.where(eq(profiles.id, profileId))
					.then(r => {
						const p = r[0];
						if (p) {
							return {
								...p,
								status: null,
								statusType: null,
								coverImageUrl: null,
								category: null,
							};
						}
						return p;
					});
			} catch (fallbackError: any) {
				console.error("Fallback profile select also failed:", fallbackError?.message);
				// Set profile to null to prevent revalidation errors
				profile = null;
			}
		} else {
			// For other errors, log but don't throw - we can still update the profile
			console.error("Unexpected error selecting profile:", error?.message);
			profile = null;
		}
	}
	
	// Update with all provided fields
	// If columns don't exist, the error will be caught and handled
	if (Object.keys(payload).length > 0) {
		try {
			// Log payload keys instead of full payload to avoid large JSON strings
			console.log("Updating profile:", profileId, "with fields:", Object.keys(payload).join(", "));
			if (payload.coverImageUrl) {
				console.log("coverImageUrl in payload:", payload.coverImageUrl.substring(0, 100) + "...");
			}
			
			// Execute update
			const updateResult = await db
				.update(profiles)
				.set(payload)
				.where(eq(profiles.id, profileId));
			
			console.log("Update query executed successfully. Result:", updateResult);
			
			// ALWAYS verify coverImageUrl was saved (critical field)
			if (payload.coverImageUrl !== undefined && payload.coverImageUrl !== null) {
				console.log("Verifying coverImageUrl was saved...");
				try {
					// Wait a bit for database to commit
					await new Promise(resolve => setTimeout(resolve, 100));
					
					const verification = await db
						.select({ coverImageUrl: profiles.coverImageUrl })
						.from(profiles)
						.where(eq(profiles.id, profileId))
						.limit(1);
					
					if (verification && verification.length > 0) {
						const savedValue = verification[0].coverImageUrl;
						const expectedValue = payload.coverImageUrl;
						console.log("Verification - Expected:", expectedValue?.substring(0, 100) + "...");
						console.log("Verification - Saved:", savedValue?.substring(0, 100) + "..." || "NULL");
						
						if (savedValue === expectedValue) {
							console.log("✅ coverImageUrl verification successful!");
						} else if (savedValue === null || savedValue === undefined) {
							console.error("❌ CRITICAL: coverImageUrl is NULL in database after update!");
							console.error("This means the update did not save coverImageUrl. Retrying with raw SQL...");
							
							// Retry update with raw SQL to ensure it works
							try {
								console.log("Attempting raw SQL update for coverImageUrl...");
								const rawUpdateResult = await db.execute(
									sql`UPDATE profiles SET cover_image_url = ${expectedValue} WHERE id = ${profileId}`
								);
								console.log("Raw SQL update result:", rawUpdateResult);
								
								// Wait a bit for database to commit
								await new Promise(resolve => setTimeout(resolve, 200));
								
								// Verify again with Drizzle select (more reliable than raw SQL for reading)
								const rawVerification = await db
									.select({ coverImageUrl: profiles.coverImageUrl })
									.from(profiles)
									.where(eq(profiles.id, profileId))
									.limit(1);
								
								console.log("Raw SQL verification result:", rawVerification);
								
								if (rawVerification && rawVerification.length > 0) {
									const rawSavedValue = rawVerification[0].coverImageUrl;
									console.log("Raw SQL - Saved value:", rawSavedValue?.substring(0, 100) + "..." || "NULL");
									
									if (rawSavedValue === expectedValue) {
										console.log("✅ coverImageUrl saved successfully with raw SQL!");
									} else {
										console.error("❌ CRITICAL: coverImageUrl still not saved after raw SQL update!");
										console.error("Expected:", expectedValue?.substring(0, 100));
										console.error("Got:", rawSavedValue?.substring(0, 100) || "NULL");
									}
								} else {
									console.error("❌ CRITICAL: Raw SQL verification returned no rows!");
								}
							} catch (rawError: any) {
								console.error("❌ CRITICAL: Raw SQL update failed:", rawError?.message);
								console.error("Raw SQL error stack:", rawError?.stack);
								
								// Try one more time with Drizzle ORM
								try {
									console.log("Attempting Drizzle ORM retry...");
									await db
										.update(profiles)
										.set({ coverImageUrl: expectedValue })
										.where(eq(profiles.id, profileId));
									
									// Verify again
									const retryVerification = await db
										.select({ coverImageUrl: profiles.coverImageUrl })
										.from(profiles)
										.where(eq(profiles.id, profileId))
										.limit(1);
									
									if (retryVerification && retryVerification.length > 0 && retryVerification[0].coverImageUrl === expectedValue) {
										console.log("✅ coverImageUrl saved successfully after Drizzle retry!");
									} else {
										console.error("❌ CRITICAL: coverImageUrl still not saved after Drizzle retry!");
									}
								} catch (retryError: any) {
									console.error("❌ CRITICAL: Drizzle retry also failed:", retryError?.message);
								}
							}
						} else {
							console.error("❌ coverImageUrl verification failed! Expected:", expectedValue?.substring(0, 100), "Got:", savedValue?.substring(0, 100));
						}
					} else {
						console.error("❌ Verification failed: Profile not found");
					}
				} catch (verificationError: any) {
					// This is critical - log as error
					console.error("❌ CRITICAL: Verification query failed:", verificationError?.message);
					console.error("Verification error stack:", verificationError?.stack);
				}
			}
			
			console.log("Profile updated successfully");
		} catch (error: any) {
			console.error("Error updating profile:", error);
			console.error("Error details:", {
				message: error?.message,
				code: error?.code,
				stack: error?.stack,
			});
			
			// Only remove columns if error explicitly mentions they don't exist
			const isStatusColumnMissing = error?.message?.includes('column "status" does not exist') || 
				(error?.code === '42703' && error?.message?.includes('status') && error?.message?.includes('does not exist'));
			const isCoverImageColumnMissing = error?.message?.includes('column "cover_image_url" does not exist') || 
				(error?.code === '42703' && error?.message?.includes('cover_image_url') && error?.message?.includes('does not exist'));
			const isCategoryColumnMissing = error?.message?.includes('column "category" does not exist') || 
				(error?.code === '42703' && error?.message?.includes('category') && error?.message?.includes('does not exist'));
			
			if (isStatusColumnMissing || isCoverImageColumnMissing || isCategoryColumnMissing) {
				// Create a new payload without missing columns
				const fallbackPayload: Record<string, any> = { ...payload };
				if (isStatusColumnMissing) {
					delete fallbackPayload.status;
					delete fallbackPayload.statusType;
					console.warn("Status columns don't exist, removing from payload");
				}
				if (isCoverImageColumnMissing) {
					delete fallbackPayload.coverImageUrl;
					console.warn("cover_image_url column doesn't exist, removing from payload");
				}
				if (isCategoryColumnMissing) {
					delete fallbackPayload.category;
					console.warn("Category column doesn't exist, removing from payload");
				}
				
				if (Object.keys(fallbackPayload).length > 0) {
					console.log("Retrying update with fallback payload fields:", Object.keys(fallbackPayload).join(", "));
					await db
						.update(profiles)
						.set(fallbackPayload)
						.where(eq(profiles.id, profileId));
					console.log("Profile updated successfully with fallback payload");
				} else {
					console.warn("All fields were removed from payload, nothing to update");
				}
			} else {
				// Check if error is about category column (which we handle separately)
				const isCategoryError = error?.message?.includes('column "category"') || 
					(error?.code === '42703' && error?.message?.includes('category'));
				
				if (isCategoryError) {
					console.warn("Category column doesn't exist, retrying update without category but keeping coverImageUrl...");
					// Create payload without category but keep coverImageUrl
					const retryPayload: Record<string, any> = { ...payload };
					delete retryPayload.category;
					
					console.log("Retrying update with payload (without category):", Object.keys(retryPayload).join(", "));
					if (retryPayload.coverImageUrl) {
						console.log("✅ coverImageUrl still in retry payload:", retryPayload.coverImageUrl.substring(0, 100) + "...");
					}
					
					try {
						await db
							.update(profiles)
							.set(retryPayload)
							.where(eq(profiles.id, profileId));
						
						console.log("✅ Profile updated successfully without category column");
						
						// Verify coverImageUrl was saved
						if (retryPayload.coverImageUrl) {
							const verifyRetry = await db
								.select({ coverImageUrl: profiles.coverImageUrl })
								.from(profiles)
								.where(eq(profiles.id, profileId))
								.limit(1);
							
							if (verifyRetry && verifyRetry.length > 0) {
								const saved = verifyRetry[0].coverImageUrl;
								if (saved === retryPayload.coverImageUrl) {
									console.log("✅ coverImageUrl verified after retry!");
								} else {
									console.error("❌ coverImageUrl still not saved after retry:", saved?.substring(0, 100) || "NULL");
								}
							}
						}
					} catch (retryError: any) {
						console.error("Retry update also failed:", retryError?.message);
						// Don't throw - let outer catch handle it
					}
				} else {
					// For other errors, log but don't throw - we'll let outer catch handle it
					console.error("Unexpected error during profile update:", error);
					// Don't throw here - let outer catch handle it with better error message
				}
			}
		}
	}
	
	// Always try to save category to profile_categories table (as fallback or primary storage)
	// This ensures category is saved even if profiles.category column doesn't exist
	if (categoryValue !== undefined) {
		try {
			if (categoryValue === null || categoryValue === "") {
				// Delete from profile_categories if category is cleared
				await db
					.delete(profileCategories)
					.where(eq(profileCategories.profileId, profileId));
				console.log("Category cleared from profile_categories table");
			} else {
				// Upsert to profile_categories table
				await db
					.insert(profileCategories)
					.values({
						profileId: profileId,
						category: categoryValue,
					})
					.onConflictDoUpdate({
						target: profileCategories.profileId,
						set: {
							category: categoryValue,
						},
					});
				console.log("Category saved to profile_categories table:", categoryValue);
			}
		} catch (categoryError: any) {
			// If profile_categories table doesn't exist yet, log error
			console.error("Failed to save category to profile_categories table:", categoryError?.message);
			// Don't throw - profile update might have succeeded, just category storage failed
		}
	}
	
	// Force revalidate all related paths
	// Wrap in try-catch to prevent revalidation errors from breaking the update
	try {
		revalidatePath("/dashboard", "page");
		revalidatePath("/dashboard/profile", "page");
		if (profile?.username) {
			revalidatePath(`/u/${profile.username}`, "page");
			revalidatePath(`/@${profile.username}`, "page");
			revalidatePath(`/u/${profile.username}/card`, "page");
		}
		revalidatePath("/explore", "page");
		revalidatePath("/", "layout"); // Force revalidate entire app
	} catch (revalidateError: any) {
		// Don't fail the update if revalidation fails
		console.warn("Revalidation failed (non-critical):", revalidateError?.message);
	}
	} catch (outerError: any) {
		// Catch any unexpected errors that weren't handled above
		console.error("Unexpected error in updateProfileAction:", outerError);
		console.error("Error details:", {
			message: outerError?.message,
			code: outerError?.code,
			stack: outerError?.stack,
		});
		
		// Try to provide a more helpful error message
		let errorMessage = "Gagal memperbarui profil";
		if (outerError?.message) {
			if (outerError.message.includes("JSON")) {
				errorMessage = "Data terlalu besar atau tidak valid. Silakan coba lagi dengan data yang lebih kecil.";
			} else if (outerError.message.includes("timeout")) {
				errorMessage = "Waktu habis. Silakan coba lagi.";
			} else if (outerError.message.includes("connection")) {
				errorMessage = "Gagal terhubung ke database. Silakan coba lagi.";
			} else {
				errorMessage = `Gagal memperbarui profil: ${outerError.message}`;
			}
		}
		
		// Re-throw with a cleaner error message
		throw new Error(errorMessage);
	}
}

// A/B Testing Variant Actions
export async function addVariantAction(
	blockId: string,
	variantName: string,
	data: Record<string, unknown>,
	trafficSplit: number
) {
	await db.insert(blockVariants).values({
		id: randomUUID(),
		blockId,
		variantName,
		dataJson: JSON.stringify(data),
		trafficSplit,
		isActive: true,
		impressions: 0,
	});
	revalidatePath("/dashboard");
}

export async function updateVariantAction(
	variantId: string,
	fields: {
		variantName?: string;
		data?: Record<string, unknown>;
		trafficSplit?: number;
		isActive?: boolean;
	}
) {
	const payload: any = {};
	if (typeof fields.variantName === "string") payload.variantName = fields.variantName;
	if (fields.data) payload.dataJson = JSON.stringify(fields.data);
	if (typeof fields.trafficSplit === "number") payload.trafficSplit = fields.trafficSplit;
	if (typeof fields.isActive === "boolean") payload.isActive = fields.isActive;
	if (Object.keys(payload).length === 0) return;
	await db.update(blockVariants).set(payload).where(eq(blockVariants.id, variantId));
	revalidatePath("/dashboard");
}

export async function deleteVariantAction(variantId: string) {
	await db.delete(blockVariants).where(eq(blockVariants.id, variantId));
	revalidatePath("/dashboard");
}

export async function getVariantsAction(blockId: string) {
	return await db.select().from(blockVariants).where(eq(blockVariants.blockId, blockId));
}

export async function getVariantAnalyticsAction(blockId: string) {
	const variants = await db.select().from(blockVariants).where(eq(blockVariants.blockId, blockId));
	const variantIds = variants.map((v: any) => v.id);
	
	if (variantIds.length === 0) {
		return [];
	}
	
	// Get click counts for each variant
	const allClicks = await db
		.select()
		.from(clicks)
		.where(eq(clicks.blockId, blockId));
	
	const clicksByVariant = new Map<string, number>();
	for (const click of allClicks) {
		if (click.variantId) {
			clicksByVariant.set(click.variantId, (clicksByVariant.get(click.variantId) || 0) + 1);
		}
	}
	
	return variants.map((v: any) => ({
		...v,
		clicks: clicksByVariant.get(v.id) || 0,
		ctr: v.impressions > 0 ? ((clicksByVariant.get(v.id) || 0) / v.impressions) * 100 : 0,
	}));
}

// Privacy & Account Actions
export async function updatePasswordAction(currentPassword: string, newPassword: string) {
	const supabase = await createClient();
	
	// Get current user
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return { success: false, error: "Unauthorized" };
	}
	
	// Verify current password by attempting to sign in
	const { error: signInError } = await supabase.auth.signInWithPassword({
		email: user.email!,
		password: currentPassword,
	});
	
	if (signInError) {
		return { success: false, error: "Password saat ini salah" };
	}
	
	// Update password
	const { error: updateError } = await supabase.auth.updateUser({
		password: newPassword,
	});
	
	if (updateError) {
		return { success: false, error: updateError.message };
	}
	
	return { success: true };
}

export async function deleteAccountAction() {
	const supabase = await createClient();
	
	// Get current user
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return { success: false, error: "Unauthorized" };
	}
	
	// Get user's profile (with fallback for missing columns)
	let profile: any;
	try {
		profile = await db.select().from(profiles).where(eq(profiles.userId, user.id)).then(r => r[0]);
	} catch (error: any) {
		// If category column doesn't exist, select without it
		if (error?.message?.includes('category') || error?.code === '42703') {
			profile = await db.select({
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
			}).from(profiles).where(eq(profiles.userId, user.id)).then(r => r[0]);
		} else {
			throw error;
		}
	}
	
	if (profile) {
		// Delete all related data in order:
		// 1. Delete all clicks for all blocks
		const userBlocks = await db.select().from(blocks).where(eq(blocks.profileId, profile.id));
		for (const block of userBlocks) {
			await db.delete(clicks).where(eq(clicks.blockId, block.id));
			await db.delete(blockVariants).where(eq(blockVariants.blockId, block.id));
		}
		
		// 2. Delete all blocks
		await db.delete(blocks).where(eq(blocks.profileId, profile.id));
		
		// 3. Delete profile
		await db.delete(profiles).where(eq(profiles.id, profile.id));
	}
	
	// 4. Delete user from database
	await db.delete(users).where(eq(users.id, user.id));
	
	// 5. Sign out user
	await supabase.auth.signOut();
	
	// Redirect to home
	// Note: We can't actually delete the auth user from Supabase client-side
	// The user record in auth.users will remain, but all app data is deleted
	redirect("/");
}

// Analytics Actions
export async function getAnalyticsAction(profileId: string) {
	const now = new Date();
	const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	
	// Get total visits
	const totalVisits = await db
		.select()
		.from(visits)
		.where(eq(visits.profileId, profileId))
		.then(r => r.length);
	
	// Get visits in last 7 days
	const visitsLast7Days = await db
		.select()
		.from(visits)
		.where(eq(visits.profileId, profileId))
		.then(r => r.filter(v => v.ts && new Date(v.ts) >= last7Days).length);
	
	// Get visits in last 30 days
	const visitsLast30Days = await db
		.select()
		.from(visits)
		.where(eq(visits.profileId, profileId))
		.then(r => r.filter(v => v.ts && new Date(v.ts) >= last30Days).length);
	
	// Get only visible blocks for this profile (important blocks only)
	const profileBlocks = await db
		.select()
		.from(blocks)
		.where(and(
			eq(blocks.profileId, profileId),
			eq(blocks.isVisible, true)
		));
	
	// Get total clicks only for visible blocks
	const allClicks = await db
		.select()
		.from(clicks)
		.then(r => r.filter(c => profileBlocks.some(b => b.id === c.blockId)));
	
	const totalClicks = allClicks.length;
	
	// Get clicks per block (only visible blocks with clicks > 0)
	const clicksPerBlock = await Promise.all(
		profileBlocks.map(async (block) => {
			const blockClicks = await db
				.select()
				.from(clicks)
				.where(eq(clicks.blockId, block.id))
				.then(r => r.length);
			
			const data = JSON.parse(block.dataJson) as Record<string, unknown>;
			return {
				blockId: block.id,
				blockType: block.type,
				blockTitle: String(data.title || data.handle || block.type),
				clicks: blockClicks,
			};
		})
	).then(results => results.filter(item => item.clicks > 0).sort((a, b) => b.clicks - a.clicks));
	
	// Get clicks in last 7 days
	const clicksLast7Days = allClicks.filter(c => c.ts && new Date(c.ts) >= last7Days).length;
	
	// Get clicks in last 30 days
	const clicksLast30Days = allClicks.filter(c => c.ts && new Date(c.ts) >= last30Days).length;
	
	// Get recent visits (last 10)
	const recentVisits = await db
		.select()
		.from(visits)
		.where(eq(visits.profileId, profileId))
		.then(r => r
			.sort((a, b) => {
				const aTime = a.ts ? new Date(a.ts).getTime() : 0;
				const bTime = b.ts ? new Date(b.ts).getTime() : 0;
				return bTime - aTime;
			})
			.slice(0, 10)
			.map(v => ({
				ts: v.ts,
				referrer: v.referrer,
			}))
		);
	
	// Get top referrers
	const referrerCounts = new Map<string, number>();
	allClicks.forEach(c => {
		if (c.referrer) {
			try {
				const url = new URL(c.referrer);
				const domain = url.hostname.replace('www.', '');
				referrerCounts.set(domain, (referrerCounts.get(domain) || 0) + 1);
			} catch {
				// Invalid URL, skip
			}
		}
	});
	
	const topReferrers = Array.from(referrerCounts.entries())
		.map(([domain, count]) => ({ domain, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	// Device breakdown from userAgent
	const deviceCounts = new Map<string, number>();
	const allVisitsWithUA = await db
		.select()
		.from(visits)
		.where(eq(visits.profileId, profileId));
	
	allVisitsWithUA.forEach(v => {
		if (v.userAgent) {
			const ua = v.userAgent.toLowerCase();
			let device = "Unknown";
			if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone") || ua.includes("ipad")) {
				device = "Mobile";
			} else if (ua.includes("tablet")) {
				device = "Tablet";
			} else {
				device = "Desktop";
			}
			deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
		}
	});

	const deviceBreakdown = Array.from(deviceCounts.entries())
		.map(([device, count]) => ({ device, count }))
		.sort((a, b) => b.count - a.count);

	// Conversion rate per block (clicks / visits untuk block tersebut)
	const clicksWithConversion = clicksPerBlock.map(block => {
		const blockVisits = allVisitsWithUA.length; // Total visits to profile
		const conversionRate = blockVisits > 0 ? (block.clicks / blockVisits) * 100 : 0;
		return {
			...block,
			conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
		};
	});

	// Overall conversion rate
	const overallConversionRate = totalVisits > 0 ? (totalClicks / totalVisits) * 100 : 0;
	
	return {
		totalVisits,
		visitsLast7Days,
		visitsLast30Days,
		totalClicks,
		clicksLast7Days,
		clicksLast30Days,
		clicksPerBlock: clicksWithConversion.sort((a, b) => b.clicks - a.clicks),
		recentVisits,
		topReferrers,
		deviceBreakdown,
		overallConversionRate: Math.round(overallConversionRate * 100) / 100,
	};
}

// ============ MULTI-PROFILE MANAGEMENT ============

function normalizeUsername(raw: string): string {
	return raw
		.toLowerCase()
		.replace(/[^a-z0-9._-]/g, "")
		.replace(/^[._-]+|[._-]+$/g, "")
		.slice(0, 30);
}

async function revalidateDashboardPaths() {
	revalidatePath("/dashboard");
	revalidatePath("/dashboard/pages");
	revalidatePath("/dashboard/editor");
	revalidatePath("/dashboard/profile");
}

/**
 * Membuat profil baru. User free hanya boleh punya 1 profil,
 * user Pro boleh membuat banyak profil.
 */
export async function createProfileAction(username: string, displayName: string): Promise<{ profileId: string }> {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		throw new Error("Unauthorized");
	}

	const dbUser = await db.select().from(users).where(eq(users.id, user.id)).then(r => r[0]);
	const isPro = dbUser?.isPro ?? false;

	// Validate input
	const cleanName = normalizeUsername(username);
	const cleanDisplay = displayName.trim();
	if (!cleanName) {
		throw new Error("Username tidak valid");
	}
	if (!cleanDisplay) {
		throw new Error("Display name tidak boleh kosong");
	}

	// Count existing profiles
	const { count: profileCount } = (
		await db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.userId, user.id))
	)[0] ?? { count: 0 };

	if (!isPro && profileCount >= 1) {
		throw new Error("Hanya user PRO yang dapat membuat lebih dari satu profil");
	}

	// Unique username check
	const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, cleanName)).then(r => r[0]);
	if (existing) {
		throw new Error(`Username @${cleanName} sudah digunakan`);
	}

	const profileId = randomUUID();
	// Gunakan INSERT minimal (persis seperti halaman dashboard/editor/profile)
	// karena database live mungkin TIDAK memiliki semua kolom yang dideklarasikan
	// di skema (mis. category, status_type, cover_image_url). Insert penuh Drizzle
	// yang memasukkan semua kolom dapat gagal dgn 42703 (kolom tidak ada).
	const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
	if (!connectionString) {
		throw new Error("POSTGRES_URL not configured");
	}
	const pg = postgres(connectionString, { prepare: false, max: 1 });
	try {
		await pg`
			INSERT INTO profiles (id, user_id, username, display_name, bio, avatar_url)
			VALUES (${profileId}, ${user.id}, ${cleanName}, ${cleanDisplay}, NULL, NULL)
		`;
	} finally {
		await pg.end();
	}

	// Set as active profile
	await db.update(users).set({ activeProfileId: profileId }).where(eq(users.id, user.id));

	await revalidateDashboardPaths();
	revalidatePath(`/u/${cleanName}`);
	revalidatePath(`/@${cleanName}`);
	return { profileId };
}

/**
 * Menetapkan profil aktif untuk user.
 */
export async function setActiveProfileAction(profileId: string): Promise<{ error?: string }> {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return { error: "Unauthorized" };
	}

	const profile = await db
		.select({ id: profiles.id, userId: profiles.userId })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.then(r => r[0]);
	if (!profile || profile.userId !== user.id) {
		return { error: "Unauthorized: User does not own this profile" };
	}

	await db.update(users).set({ activeProfileId: profileId }).where(eq(users.id, user.id));
	await revalidateDashboardPaths();
	return { error: undefined };
}

/**
 * Menghapus profil milik user. Tidak boleh menghapus profil terakhir.
 */
export async function deleteProfileAction(profileId: string): Promise<{ error?: string }> {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return { error: "Unauthorized" };
	}

	const profile = await db
		.select({ id: profiles.id, userId: profiles.userId, username: profiles.username })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.then(r => r[0]);
	if (!profile || profile.userId !== user.id) {
		return { error: "Unauthorized: tidak memiliki profil ini" };
	}

	const profileCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(profiles)
		.where(eq(profiles.userId, user.id))
		.then(r => Number(r[0]?.count ?? 0));

	if (profileCount <= 1) {
		return { error: "Anda harus memiliki minimal satu profil" };
	}

	// Jika menghapus profil aktif, kosongkan active_profile_id (akan fallback ke profil pertama)
	const dbUser = await db.select({ activeProfileId: users.activeProfileId }).from(users).where(eq(users.id, user.id)).then(r => r[0]);
	if (dbUser?.activeProfileId === profileId) {
		await db.update(users).set({ activeProfileId: null }).where(eq(users.id, user.id));
	}

	await db.delete(profiles).where(eq(profiles.id, profileId));
	await revalidateDashboardPaths();
	revalidatePath(`/u/${profile.username}`);
	revalidatePath(`/@${profile.username}`);
	return { error: undefined };
}

/**
 * Mengubah username sebuah profil milik user. Username harus unik.
 */
export async function renameProfileAction(profileId: string, newUsername: string): Promise<{ error?: string }> {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user) {
		return { error: "Unauthorized" };
	}

	const profile = await db
		.select({ id: profiles.id, userId: profiles.userId, username: profiles.username })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.then(r => r[0]);
	if (!profile || profile.userId !== user.id) {
		return { error: "Unauthorized: tidak memiliki profil ini" };
	}

	const cleanName = normalizeUsername(newUsername);
	if (!cleanName) {
		return { error: "Username tidak valid" };
	}

	// Username sama — tidak ada perubahan
	if (cleanName === profile.username) {
		return { error: undefined };
	}

	// Cek keunikan terhadap profil lain
	const existing = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.username, cleanName))
		.then(r => r[0]);
	if (existing && existing.id !== profileId) {
		return { error: `Username @${cleanName} sudah digunakan` };
	}

	const oldUsername = profile.username;
	await db.update(profiles).set({ username: cleanName }).where(eq(profiles.id, profileId));

	await revalidateDashboardPaths();
	revalidatePath(`/u/${oldUsername}`);
	revalidatePath(`/@${oldUsername}`);
	revalidatePath(`/u/${cleanName}`);
	revalidatePath(`/@${cleanName}`);
	return { error: undefined };
}


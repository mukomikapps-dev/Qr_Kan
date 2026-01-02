import { db } from "@/db/client";
import { clicks, visits, blockVariants, profiles, blocks } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user's profile
		const profile = (await db.select().from(profiles).where(eq(profiles.userId, user.id)))[0];
		
		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Get all blocks for this profile
		const userBlocks = await db.select().from(blocks).where(eq(blocks.profileId, profile.id));
		const blockIds = userBlocks.map(b => b.id);

		// Delete all clicks for user's blocks
		if (blockIds.length > 0) {
			await db.delete(clicks).where(inArray(clicks.blockId, blockIds));
		}

		// Delete all visits for user's profile
		await db.delete(visits).where(eq(visits.profileId, profile.id));

		// Reset impressions for all block variants
		if (blockIds.length > 0) {
			const variants = await db.select().from(blockVariants).where(inArray(blockVariants.blockId, blockIds));
			for (const variant of variants) {
				await db.update(blockVariants).set({ impressions: 0 }).where(eq(blockVariants.id, variant.id));
			}
		}

		return NextResponse.json({ 
			success: true, 
			message: "All analytics data has been reset" 
		});
	} catch (error) {
		console.error("Reset analytics error:", error);
		return NextResponse.json({ 
			error: "Failed to reset analytics" 
		}, { status: 500 });
	}
}


import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { isNull, not } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Copy bgImageUrl to coverImageUrl where coverImageUrl is empty
 */

export async function POST() {
  try {
    // Copy bgImageUrl to coverImageUrl where coverImageUrl is null but bgImageUrl exists
    const result = await db
      .update(profiles)
      .set({ coverImageUrl: profiles.bgImageUrl })
      .where(isNull(profiles.coverImageUrl))
      .execute();

    console.log(`Updated profiles with cover images from bg_image_url`);
    
    return NextResponse.json({ 
      message: `Successfully populated cover images from database`,
      updated: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check current status
    const total = await db.select().from(profiles);
    const withCover = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(not(isNull(profiles.coverImageUrl)));

    const samples = await db
      .select({ 
        username: profiles.username, 
        coverImageUrl: profiles.coverImageUrl,
        displayName: profiles.displayName
      })
      .from(profiles)
      .limit(10);

    return NextResponse.json({
      total: total.length,
      withCover: withCover.length,
      withoutCover: total.length - withCover.length,
      samples: samples.map(p => ({
        username: p.username,
        displayName: p.displayName,
        hasCover: !!p.coverImageUrl
      }))
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

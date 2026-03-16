import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check profiles with and without cover image
    const total = await db.select().from(profiles);
    const withCover = await db
      .select()
      .from(profiles)
      .where(sql`${profiles.coverImageUrl} IS NOT NULL`);

    const sampleProfiles = await db
      .select({
        username: profiles.username,
        displayName: profiles.displayName,
        coverImageUrl: profiles.coverImageUrl,
      })
      .from(profiles)
      .limit(20);

    return NextResponse.json({
      total: total.length,
      withCover: withCover.length,
      samples: sampleProfiles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

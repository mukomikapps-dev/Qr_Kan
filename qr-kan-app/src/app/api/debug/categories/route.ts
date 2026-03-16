import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get first 20 profiles with categories
    const allProfiles = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        category: profiles.category,
      })
      .from(profiles)
      .where(sql`${profiles.category} IS NOT NULL`)
      .limit(20);

    const data = allProfiles.map(p => ({
      username: p.username,
      category: p.category,
      categoryType: typeof p.category,
      categoryLength: p.category ? String(p.category).length : 0,
    }));

    return NextResponse.json({ profiles: data, total: data.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

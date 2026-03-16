import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { isNull, not } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Generate a cover image URL based on profile username
 * Uses different Unsplash images for variety
 */
function generateCoverImageUrl(username: string): string {
  const images = [
    'https://images.unsplash.com/photo-1537498425046-c894cddc4945?w=800&h=1200&fit=crop&q=80', // Tech
    'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=800&h=1200&fit=crop&q=80', // Business
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1200&fit=crop&q=80', // Creative
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=1200&fit=crop&q=80', // Digital
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=1200&fit=crop&q=80', // Modern
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=1200&fit=crop&q=80', // Workspace
  ];
  
  // Use username to seed which image to pick (deterministic)
  const hash = username.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  const imageIndex = hash % images.length;
  return images[imageIndex];
}

export async function POST() {
  try {
    // Get profiles without cover_image_url
    const profilesWithoutCover = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(isNull(profiles.coverImageUrl));

    console.log(`Found ${profilesWithoutCover.length} profiles without cover image`);

    if (profilesWithoutCover.length === 0) {
      return NextResponse.json({ 
        message: "All profiles already have cover images",
        updated: 0
      });
    }

    // Update each profile
    let updated = 0;
    const results: Array<{ username: string; coverUrl: string }> = [];
    
    for (const profile of profilesWithoutCover) {
      const coverUrl = generateCoverImageUrl(profile.username);
      
      await db
        .update(profiles)
        .set({ coverImageUrl: coverUrl })
        .where(isNull(profiles.coverImageUrl));
      
      updated++;
      results.push({ username: profile.username, coverUrl });
    }

    console.log(`Updated ${updated} profiles with cover images`);
    
    return NextResponse.json({ 
      message: `Successfully updated ${updated} profiles`,
      updated,
      samples: results.slice(0, 5)
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

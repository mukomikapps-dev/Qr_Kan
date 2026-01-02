import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const profile = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        coverImageUrl: profiles.coverImageUrl,
      })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile || profile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      profileId: profile[0].id,
      username: profile[0].username,
      coverImageUrl: profile[0].coverImageUrl,
      hasCoverImage: !!profile[0].coverImageUrl,
    });
  } catch (error: any) {
    console.error("Debug cover image error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { coverImageUrl } = await req.json();

    if (!coverImageUrl) {
      return NextResponse.json({ error: "coverImageUrl is required" }, { status: 400 });
    }

    // Get user's profile
    const profile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile || profile.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update coverImageUrl directly
    console.log("Direct update - Setting coverImageUrl to:", coverImageUrl.substring(0, 100) + "...");
    
    await db
      .update(profiles)
      .set({ coverImageUrl })
      .where(eq(profiles.id, profile[0].id));

    // Verify
    const updated = await db
      .select({ coverImageUrl: profiles.coverImageUrl })
      .from(profiles)
      .where(eq(profiles.id, profile[0].id))
      .limit(1);

    return NextResponse.json({
      success: true,
      updated: updated[0]?.coverImageUrl === coverImageUrl,
      coverImageUrl: updated[0]?.coverImageUrl,
    });
  } catch (error: any) {
    console.error("Debug cover image update error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


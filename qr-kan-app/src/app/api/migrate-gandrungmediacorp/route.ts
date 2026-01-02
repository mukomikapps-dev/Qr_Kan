import { db } from "@/db/client";
import { users, profiles, blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import postgres from "postgres";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const admin = await getCurrentAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Create/Get user in Supabase Auth
    const email = "gandrungmediacorp@gmail.com";
    const password = "Bandung2026";
    let userId: string;

    try {
      // Try to sign in first (user might already exist)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData?.user) {
        userId = signInData.user.id;
        console.log("User already exists in Supabase Auth:", userId);
      } else {
        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username: "gandrungmediacorp",
            display_name: "PT Gandrung Media Corp.",
          },
        });

        if (signUpError) {
          throw new Error(`Failed to create user in Supabase: ${signUpError.message}`);
        }

        if (!signUpData.user) {
          throw new Error("Failed to create user in Supabase: No user data returned");
        }

        userId = signUpData.user.id;
        console.log("Created user in Supabase Auth:", userId);
      }
    } catch (error: any) {
      console.error("Error with Supabase Auth:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Step 2: Create/Get user in database
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length === 0) {
      try {
        await db.insert(users).values({
          id: userId,
          email,
          isPro: false,
          isSuperAdmin: false,
        });
        console.log("Created user in database");
      } catch (dbError: any) {
        // Handle duplicate key or missing isSuperAdmin column
        if (dbError?.code === '23505' || dbError?.message?.includes('duplicate key') || dbError?.message?.includes('already exists')) {
          console.log("User already exists in database");
        } else if (dbError?.message?.includes('is_super_admin') || dbError?.code === '42703') {
          try {
            await db.insert(users).values({
              id: userId,
              email,
              isPro: false,
            });
            console.log("Created user in database (without isSuperAdmin)");
          } catch (insertError: any) {
            if (insertError?.code === '23505' || insertError?.message?.includes('duplicate key')) {
              console.log("User already exists in database");
            } else {
              throw insertError;
            }
          }
        } else {
          throw dbError;
        }
      }
    } else {
      userId = existingUsers[0].id;
      console.log("User already exists in database:", userId);
    }

  // Step 3: Create/Update profile
  const username = "gandrungmediacorp";
  const displayName = "PT Gandrung Media Corp.";
  const bio = "Gandrung Corporation";
  const avatarUrl = "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesProfile%2Fphoto_kL9x6Zn4f6Md4yuETffnnrjAD6F3?alt=media&token=d2333c04-e554-40d0-9028-d1a02cab41c0";

  // Try to get existing profile with fallback for missing columns
  let existingProfiles: any[];
  try {
    existingProfiles = await db.select().from(profiles).where(eq(profiles.username, username));
  } catch (error: any) {
    // If columns don't exist, select only basic columns
    if (error?.message?.includes('category') || error?.message?.includes('status') || error?.message?.includes('cover_image_url') || error?.code === '42703') {
      existingProfiles = await db
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
        .where(eq(profiles.username, username));
    } else {
      throw error;
    }
  }

  let profileId: string;

  if (existingProfiles.length === 0) {
    profileId = randomUUID();
    // Use raw SQL directly to avoid Drizzle trying to insert columns that might not exist
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
      throw new Error("POSTGRES_URL not configured");
    }
    const sql = postgres(connectionString, { prepare: false });
    try {
      await sql`
        INSERT INTO profiles (id, user_id, username, display_name, bio, avatar_url)
        VALUES (${profileId}, ${userId}, ${username}, ${displayName}, ${bio}, ${avatarUrl})
      `;
      console.log("Created profile:", profileId);
    } finally {
      await sql.end();
    }
  } else {
    profileId = existingProfiles[0].id;
    // Update existing profile (only update columns that exist)
    try {
      await db
        .update(profiles)
        .set({
          displayName,
          bio,
          avatarUrl,
        })
        .where(eq(profiles.id, profileId));
      console.log("Updated profile:", profileId);
    } catch (updateError: any) {
      // If update fails due to missing columns, that's OK - basic fields should still work
      console.warn("Profile update warning:", updateError.message);
    }
  }

    // Step 4: Delete existing blocks and create new ones
    await db.delete(blocks).where(eq(blocks.profileId, profileId));
    console.log("Deleted existing blocks");

    // Step 5: Create blocks in order (based on created_at from Firebase data)
    const blocksData = [
      // Link: Wireless Interactive Classroom & Meetingroom Package (July 13, 2024 at 12:22:25 PM)
      {
        type: "link",
        data: {
          title: "Wireless Interactive Classroom & Meetingroom Package",
          url: "https://smartbio.link/wireless_Interactive_for_Class_MeetingRoom",
        },
        order: 0,
      },
      // Heading: HOT Call Q & A : (July 1, 2024 at 11:00:49 PM)
      {
        type: "heading",
        data: { heading: "HOT Call Q & A :", size: "medium" },
        order: 1,
      },
      // Link: Smart Digital Library (November 24, 2024 at 11:05:23 PM)
      {
        type: "link",
        data: {
          title: "Smart Digital Library",
          url: "https://smartbio.link/Smart_Digital_Library",
        },
        order: 2,
      },
      // Link: Catalog Product AudioVisual Contractor (July 1, 2024 at 10:56:30 PM)
      {
        type: "link",
        data: {
          title: "Catalog Product AudioVisual Contractor",
          url: "https://smartbio.link/Gandrung_Media",
        },
        order: 3,
      },
      // Link: e-Katalog Produk TV Interactive Digital Panel (July 1, 2024 at 10:58:56 PM)
      {
        type: "link",
        data: {
          title: "e-Katalog Produk TV Interactive Digital Panel",
          url: "https://e-katalog.lkpp.go.id/katalog/produk/detail/78849578?type=general",
        },
        order: 4,
      },
      // Link: Company Profile PT Gandrung Media Corp. (July 1, 2024 at 10:54:29 PM)
      {
        type: "link",
        data: {
          title: "Company Profile PT Gandrung Media Corp.",
          url: "https://smartbio.link/Gandrung_PortoProfile",
        },
        order: 5,
      },
      // Heading: Wireless Interactive Classroom & Meetingroom Package (July 13, 2024 at 12:21:17 PM)
      {
        type: "heading",
        data: { heading: "Wireless Interactive Classroom & Meetingroom Package", size: "medium" },
        order: 6,
      },
      // WhatsApp: +62818212777 (July 1, 2024 at 11:01:11 PM)
      {
        type: "whatsapp",
        data: {
          phone: "+62818212777",
          message: "",
          url: "https://wa.me/62818212777",
        },
        order: 7,
      },
    ];

    // Insert all blocks
    for (const blockData of blocksData) {
      await db.insert(blocks).values({
        id: randomUUID(),
        profileId,
        type: blockData.type,
        dataJson: JSON.stringify(blockData.data),
        order: blockData.order,
        isVisible: true,
      });
    }

    console.log(`Created ${blocksData.length} blocks`);

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully!",
      username,
      profileUrl: `/@${username}`,
      email,
      blocksCreated: blocksData.length,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}





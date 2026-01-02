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

    // Step 1: Get user by email (assume user already exists)
    const email = "harrygandrung@gmail.com";
    
    // Try to find user in database first
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    let userId: string;
    
    if (existingUsers.length === 0) {
      // If user doesn't exist in database, try to get from Supabase Auth
      // We can't create user without password, so we'll throw an error
      return NextResponse.json({ 
        error: "User not found. Please create user first or provide password to create user." 
      }, { status: 404 });
    } else {
      userId = existingUsers[0].id;
      console.log("Found user in database:", userId);
    }

  // Step 2: Get profile for this user
  let profile: any;
  try {
    const existingProfiles = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (existingProfiles.length === 0) {
      return NextResponse.json({ 
        error: "Profile not found for this user. Please create profile first." 
      }, { status: 404 });
    }
    profile = existingProfiles[0];
  } catch (error: any) {
    // If columns don't exist, select only basic columns
    if (error?.message?.includes('category') || error?.message?.includes('status') || error?.message?.includes('cover_image_url') || error?.code === '42703') {
      const existingProfiles = await db
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
        .where(eq(profiles.userId, userId));
      
      if (existingProfiles.length === 0) {
        return NextResponse.json({ 
          error: "Profile not found for this user. Please create profile first." 
        }, { status: 404 });
      }
      profile = existingProfiles[0];
    } else {
      throw error;
    }
  }

  const profileId = profile.id;
  const username = profile.username;

    // Step 3: Delete existing blocks and create new ones
    await db.delete(blocks).where(eq(blocks.profileId, profileId));
    console.log("Deleted existing blocks");

    // Step 4: Create blocks in order (based on created_at from Firebase data)
    // Ordered by created_at ascending
    const blocksData = [
      // Video: https://youtu.be/6yJD4k-VsAg (February 18, 2023 at 9:26:01 PM)
      {
        type: "video",
        data: {
          videoUrl: "https://youtu.be/6yJD4k-VsAg",
          posterUrl: "",
        },
        order: 0,
      },
      // Text: "One Stop Service for Your Events Equipment" (February 19, 2023 at 11:06:01 PM)
      {
        type: "text",
        data: { text: "One Stop Service for Your Events Equipment" },
        order: 1,
      },
      // Heading: "Gandrung Event Contractor" (February 19, 2023 at 11:06:23 PM)
      {
        type: "heading",
        data: { heading: "Gandrung Event Contractor", size: "medium" },
        order: 2,
      },
      // Link: "Youtube" (February 19, 2023 at 11:14:34 PM)
      {
        type: "link",
        data: {
          title: "Youtube",
          url: "https://youtube.com/channel/UCQcnlWGB8vL6dteG-16f-5A",
        },
        order: 3,
      },
      // Link: "Instagram" (February 19, 2023 at 11:20:42 PM)
      {
        type: "link",
        data: {
          title: "Instagram",
          url: "https://instagram.com/gandrungevents?igshid=ZDdkNTZiNTM=",
        },
        order: 4,
      },
      // Link: "Tiktok" (February 19, 2023 at 11:21:39 PM)
      {
        type: "link",
        data: {
          title: "Tiktok",
          url: "https://www.tiktok.com/@gandrungevents?_t=8ZaKQDp5yHB&_r=1",
        },
        order: 5,
      },
      // Heading: "address " (March 9, 2023 at 1:01:41 PM)
      {
        type: "heading",
        data: { heading: "address ", size: "medium" },
        order: 6,
      },
      // Link: "Google Map" (March 9, 2023 at 1:02:20 PM)
      {
        type: "link",
        data: {
          title: "Google Map",
          url: "https://maps.app.goo.gl/qGT99gnt98PD9JzB6?g_st=iwb",
        },
        order: 7,
      },
      // Heading: "Produk Gandrung Event" (August 1, 2023 at 8:16:23 PM)
      {
        type: "heading",
        data: { heading: "Produk Gandrung Event", size: "large" },
        order: 8,
      },
      // Link: "Rental Package Equipment" (August 1, 2023 at 9:40:32 PM)
      {
        type: "link",
        data: {
          title: "Rental Package Equipment",
          url: "https://smartbio.link/Gandrung_Events_Package",
        },
        order: 9,
      },
      // Heading: "Meeting Room Metaverse" (August 10, 2023 at 7:19:39 AM)
      {
        type: "heading",
        data: { heading: "Meeting Room Metaverse", size: "large" },
        order: 10,
      },
      // Heading: "Virtual MeetingMetaverse" (August 10, 2023 at 7:22:46 AM)
      {
        type: "heading",
        data: { heading: "Virtual MeetingMetaverse", size: "medium" },
        order: 11,
      },
      // Link: Virtual Meeting Metaverse (August 10, 2023 at 7:22:46 AM)
      {
        type: "link",
        data: {
          title: "Virtual Meeting Metaverse",
          url: "https://www.spatial.io/s/Gandrung-Meeting-Room-64313b259f2805f7f09346df",
        },
        order: 12,
      },
      // Heading: "Rental - Sales - Services" (August 10, 2023 at 9:06:18 PM)
      {
        type: "heading",
        data: { heading: "Rental - Sales - Services", size: "medium" },
        order: 13,
      },
      // Link: "Gandrung Media (Sales Div.)" (April 28, 2024 at 2:59:32 PM)
      {
        type: "link",
        data: {
          title: "Gandrung Media (Sales Div.)",
          url: "https://smartbio.link/Gandrung_Media",
        },
        order: 14,
      },
      // Link: "Gandrung EventsEquipment (Rental Div.)" (April 28, 2024 at 11:55:07 AM)
      {
        type: "link",
        data: {
          title: "Gandrung EventsEquipment (Rental Div.)",
          url: "https://smartbio.link/Gandrung.events".trim(),
        },
        order: 15,
      },
      // Link: "Gandrung Digital (CMS Digital Services)" (April 28, 2024 at 3:02:47 PM)
      {
        type: "link",
        data: {
          title: "Gandrung Digital (CMS Digital Services)",
          url: "https://smartbio.link/Gandrung_Digital",
        },
        order: 16,
      },
      // Heading: "Company Profile" (June 17, 2024 at 6:10:58 PM)
      {
        type: "heading",
        data: { heading: "Company Profile", size: "large" },
        order: 17,
      },
      // Link: "Profile & Portofolio" (June 17, 2024 at 6:11:59 PM)
      {
        type: "link",
        data: {
          title: "Profile & Portofolio",
          url: "https://smartbio.link/Gandrung_PortoProfile",
        },
        order: 18,
      },
      // Heading: "Website" (June 17, 2024 at 6:12:21 PM)
      {
        type: "heading",
        data: { heading: "Website", size: "large" },
        order: 19,
      },
      // Link: "Gandrung.co.id" (June 17, 2024 at 6:13:53 PM)
      {
        type: "link",
        data: {
          title: "Gandrung.co.id",
          url: "http://gandrung.co.id",
        },
        order: 20,
      },
      // Heading: "Whatsapp" (June 17, 2024 at 6:14:59 PM)
      {
        type: "heading",
        data: { heading: "Whatsapp", size: "large" },
        order: 21,
      },
      // Link: "Event Contractor" (June 17, 2024 at 6:14:24 PM)
      {
        type: "link",
        data: {
          title: "Event Contractor",
          url: "https://gandrung.co.id/kontraktor-event/",
        },
        order: 22,
      },
      // WhatsApp: "+62818212777" (June 17, 2024 at 6:15:56 PM)
      {
        type: "whatsapp",
        data: {
          phone: "+62818212777",
          message: "",
          url: "https://wa.me/62818212777",
        },
        order: 23,
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


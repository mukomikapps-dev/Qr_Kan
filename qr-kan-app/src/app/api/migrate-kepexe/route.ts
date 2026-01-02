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
        const email = "kepexe@gmail.com";
        const password = "User!234";
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
                        username: "kepexe",
                        display_name: "KEP EXE",
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
            await db.insert(users).values({
                id: userId,
                email,
                isPro: false,
                isSuperAdmin: false,
            });
            console.log("Created user in database");
        } else {
            userId = existingUsers[0].id;
            console.log("User already exists in database:", userId);
        }

        // Step 3: Create/Update profile
        const username = "kepexe";
        const displayName = "KEP EXE";
        const bio = "Kursus Evangelisasi Pribadi Angkatan 25";
        const avatarUrl = "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesProfile%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F2?alt=media&token=e3b91109-b3db-41f3-b692-b5eee8409cf7";

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
            // Heading
            {
                type: "heading",
                data: { heading: "KEP Executive", size: "large" },
                order: 0,
            },
            // Images
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21759077013868?alt=media&token=b6457588-341c-4d34-891e-0d19a3c4135a",
                    alt: "",
                },
                order: 1,
            },
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21759077064110?alt=media&token=b7473c93-0c6e-48c1-b765-f772665ae484",
                    alt: "",
                },
                order: 2,
            },
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21759077128188?alt=media&token=34bca4ce-a9d6-4903-811a-9dec95d93282",
                    alt: "",
                },
                order: 3,
            },
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21759077575919?alt=media&token=8b8f8e71-45e5-406b-98df-17e922dc28b7",
                    alt: "",
                },
                order: 4,
            },
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21759077600340?alt=media&token=e6b4a4c7-4509-4932-8c6f-9fb2fa8f62c4",
                    alt: "",
                },
                order: 5,
            },
            // Heading: Kontak Pendaftaran
            {
                type: "heading",
                data: { heading: "Kontak Pendaftaran", size: "medium" },
                order: 6,
            },
            // Text: bu Lucy
            {
                type: "text",
                data: { text: "bu Lucy" },
                order: 7,
            },
            // WhatsApp: +628112298900
            {
                type: "whatsapp",
                data: {
                    phone: "+628112298900",
                    message: "",
                    url: "https://wa.me/628112298900",
                },
                order: 8,
            },
            // Heading: Kabar Gembira
            {
                type: "heading",
                data: { heading: "kabar gembira..! dibuka pendaftaran baru untuk angkatan 25", size: "medium" },
                order: 9,
            },
            // Image: KEP EXE angkatan 25
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21760680034278?alt=media&token=9ef47a92-ff32-49e5-84b6-dcc7fb100c6f",
                    alt: "KEP EXE angkatan 25",
                },
                order: 10,
            },
            // Image: KEP EXECUTIVE (with title)
            {
                type: "image",
                data: {
                    imageUrl:
                        "https://firebasestorage.googleapis.com/v0/b/premium-name-card.appspot.com/o/imagesContent%2Fphoto_0Qx5djc417gLK6silMKfQFPbx5F21760673928722?alt=media&token=9ad7d2ab-abfc-45a7-bf5f-5cbe90fff142",
                    alt: "KEP EXECUTIVE",
                },
                order: 11,
            },
            // Text: Lucy
            {
                type: "text",
                data: { text: "Lucy" },
                order: 12,
            },
            // WhatsApp: +6287823695077
            {
                type: "whatsapp",
                data: {
                    phone: "+6287823695077",
                    message: "",
                    url: "https://wa.me/6287823695077",
                },
                order: 13,
            },
            // Text: Venny
            {
                type: "text",
                data: { text: "Venny" },
                order: 14,
            },
            // Text: Rekening Pembayaran
            {
                type: "text",
                data: { text: "Rekening Pembayaran Bank BCA - no Rekening 2436363688 a.n. Lucuawati/Venny Alfian" },
                order: 15,
            },
            // Link: Instagram
            {
                type: "link",
                data: {
                    title: "Instagram",
                    url: "https://www.instagram.com/reel/DKMGv1jz9R6/?igsh=MXBrdHZiNHI3ZW54eg==",
                },
                order: 16,
            },
            // Link: Testimoni
            {
                type: "link",
                data: {
                    title: "Testimoni",
                    url: "https://youtube.com/shorts/KPOkw_Ccs8c",
                },
                order: 17,
            },
            // Link: Videoclip
            {
                type: "link",
                data: {
                    title: "Videoclip",
                    url: "https://youtube.com/shorts/eLtklggM-sw",
                },
                order: 18,
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

#!/usr/bin/env node

/**
 * Script to create Floating Market Lembang user account with content
 * Usage: node scripts/create-floatingmarket.mjs
 */

import { createClient } from '@supabase/supabase-js';
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomBytes } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
try {
  const envPath = join(__dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  // .env.local might not exist
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  process.exit(1);
}

if (!connectionString) {
  console.error("❌ Error: POSTGRES_URL is required");
  process.exit(1);
}

// Floating Market Lembang user data
const userData = {
  email: "floatingmarket1@gmail.com",
  password: "User!234",
  username: "floatingmarket",
  displayName: "Floating Market Lembang",
  bio: "Tempat wisata kuliner dan rekreasi keluarga di Lembang, Bandung. Nikmati pengalaman berbelanja di atas air dengan berbagai kuliner khas dan aktivitas seru untuk seluruh keluarga.",
  category: "Wisata, Kuliner",
};

async function createFloatingMarket() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const db = postgres(connectionString, { prepare: false });

  try {
    console.log("🔄 Creating Floating Market Lembang user account...");
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log("---");

    // Step 1: Create user in Supabase Auth
    console.log("1️⃣ Creating user in Supabase Auth...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        username: userData.username,
        display_name: userData.displayName,
      },
    });

    let userId;
    if (authError) {
      if (authError.message.includes("already registered") || 
          authError.message.includes("already exists") ||
          authError.code === 'email_exists' ||
          authError.status === 422) {
        console.log("ℹ️  User already exists in Auth. Using existing user...");
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === userData.email);
        if (!user) {
          throw new Error("User exists but could not be retrieved");
        }
        userId = user.id;
        console.log(`✅ Using existing user in Auth with ID: ${userId}`);
      } else {
        throw authError;
      }
    } else {
      if (!authData?.user) {
        throw new Error("Failed to create or retrieve user");
      }
      userId = authData.user.id;
      console.log(`✅ User created in Auth with ID: ${userId}`);
    }


    // Step 2: Create user in database
    console.log("\n2️⃣ Creating user in database...");
    try {
      await db`
        INSERT INTO users (id, email, is_pro, created_at)
        VALUES (${userId}, ${userData.email}, FALSE, NOW())
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
      `;
      console.log("✅ User created in database");
    } catch (dbError) {
      if (dbError.message.includes("already exists") || dbError.message.includes("duplicate")) {
        console.log("ℹ️  User already exists in database (OK)");
      } else {
        throw dbError;
      }
    }

    // Step 3: Create profile
    console.log("\n3️⃣ Creating profile...");
    let profileId = randomBytes(16).toString('hex');
    
    try {
      // Try with category column
      await db`
        INSERT INTO profiles (
          id, user_id, username, display_name, bio, category,
          avatar_url, logo_url, show_avatar, show_display_name, 
          show_bio, show_logo, show_qr, show_icons, 
          sticky_header_bg, theme_preset_id, use_custom_colors, created_at
        )
        VALUES (
          ${profileId}, ${userId}, ${userData.username}, ${userData.displayName}, 
          ${userData.bio}, ${userData.category}, NULL, NULL, 
          TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
          'monochrome', FALSE, NOW()
        )
        ON CONFLICT (username) DO UPDATE SET 
          display_name = EXCLUDED.display_name,
          bio = EXCLUDED.bio,
          category = EXCLUDED.category
      `;
      console.log(`✅ Profile created with ID: ${profileId}`);
    } catch (profileError) {
      if (profileError.message.includes("category") || profileError.code === '42703') {
        // Fallback: create without category column
        console.log("ℹ️  Category column doesn't exist, creating profile without category...");
        try {
          await db`
            INSERT INTO profiles (
              id, user_id, username, display_name, bio,
              avatar_url, logo_url, show_avatar, show_display_name, 
              show_bio, show_logo, show_qr, show_icons, 
              sticky_header_bg, theme_preset_id, use_custom_colors, created_at
            )
            VALUES (
              ${profileId}, ${userId}, ${userData.username}, ${userData.displayName}, 
              ${userData.bio}, NULL, NULL, 
              TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
              'monochrome', FALSE, NOW()
            )
            ON CONFLICT (username) DO UPDATE SET 
              display_name = EXCLUDED.display_name,
              bio = EXCLUDED.bio
          `;
          console.log(`✅ Profile created with ID: ${profileId}`);
          
          // Try to save category to profile_categories table
          try {
            await db`
              INSERT INTO profile_categories (profile_id, category, created_at)
              VALUES (${profileId}, ${userData.category}, NOW())
              ON CONFLICT (profile_id) DO UPDATE SET category = EXCLUDED.category
            `;
            console.log("✅ Category saved to profile_categories table");
          } catch (catError) {
            console.log("⚠️  Could not save category to profile_categories table:", catError.message);
          }
        } catch (fallbackError) {
          if (fallbackError.message.includes("already exists") || fallbackError.message.includes("duplicate")) {
            console.log("ℹ️  Profile already exists. Getting existing profile...");
            const existingProfile = await db`
              SELECT id FROM profiles WHERE username = ${userData.username} LIMIT 1
            `;
            if (existingProfile.length > 0) {
              profileId = existingProfile[0].id;
              console.log(`✅ Using existing profile: ${profileId}`);
            } else {
              throw fallbackError;
            }
          } else {
            throw fallbackError;
          }
        }
      } else if (profileError.message.includes("already exists") || profileError.message.includes("duplicate")) {
        console.log("ℹ️  Profile already exists. Getting existing profile...");
        const existingProfile = await db`
          SELECT id FROM profiles WHERE username = ${userData.username} LIMIT 1
        `;
        if (existingProfile.length > 0) {
          profileId = existingProfile[0].id;
          console.log(`✅ Using existing profile: ${profileId}`);
        } else {
          throw profileError;
        }
      } else {
        throw profileError;
      }
    }

    // Step 4: Delete existing blocks (if any) and create new content blocks
    console.log("\n4️⃣ Creating content blocks...");
    
    // Delete existing blocks first
    try {
      await db`DELETE FROM blocks WHERE profile_id = ${profileId}`;
      console.log("   🗑️  Deleted existing blocks");
    } catch (deleteError) {
      console.log("   ℹ️  No existing blocks to delete");
    }
    
    const blocks = [
      {
        type: "heading",
        title: "Floating Market Lembang",
        data: { heading: "Floating Market Lembang", size: "large" },
        order: 0,
      },
      {
        type: "text",
        title: "Tentang Kami",
        data: { text: "Floating Market Lembang adalah destinasi wisata kuliner dan rekreasi keluarga yang unik di kawasan Lembang, Bandung. Nikmati pengalaman berbelanja dan kuliner di atas air dengan suasana yang menyenangkan untuk seluruh keluarga." },
        order: 1,
      },
      {
        type: "heading",
        title: "Fasilitas & Aktivitas",
        data: { heading: "Fasilitas & Aktivitas", size: "medium" },
        order: 2,
      },
      {
        type: "text",
        title: "Aktivitas",
        data: { text: "🏪 Pasar Apung - Berbelanja di atas air\n🍜 Kuliner Khas - Berbagai makanan dan minuman tradisional\n🎠 Wahana Permainan - Area bermain untuk anak-anak\n📸 Spot Foto - Berbagai spot instagramable\n🎨 Workshop & Craft - Aktivitas kreatif untuk keluarga\n🎵 Live Music - Hiburan musik di akhir pekan" },
        order: 3,
      },
      {
        type: "heading",
        title: "Jam Operasional",
        data: { heading: "Jam Operasional", size: "medium" },
        order: 4,
      },
      {
        type: "text",
        title: "Waktu Buka",
        data: { text: "🕐 Senin - Jumat: 09:00 - 17:00 WIB\n🕐 Sabtu - Minggu: 08:00 - 18:00 WIB\n\n*Jam operasional dapat berubah sesuai kondisi" },
        order: 5,
      },
      {
        type: "heading",
        title: "Lokasi",
        data: { heading: "Lokasi", size: "medium" },
        order: 6,
      },
      {
        type: "text",
        title: "Alamat",
        data: { text: "📍 Floating Market Lembang\nJl. Grand Hotel No.33E, Lembang, Kabupaten Bandung Barat, Jawa Barat 40391\n\nDapat diakses dengan kendaraan pribadi atau transportasi umum dari Bandung." },
        order: 7,
      },
      {
        type: "heading",
        title: "Kontak & Media Sosial",
        data: { heading: "Kontak & Media Sosial", size: "medium" },
        order: 8,
      },
      {
        type: "social",
        title: "Instagram",
        data: { 
          platform: "instagram", 
          handle: "@floating.market.lembang", 
          url: "https://www.instagram.com/floating.market.lembang/?hl=en" 
        },
        order: 9,
      },
      {
        type: "whatsapp",
        title: "WhatsApp",
        data: { 
          phone: "081234567890", 
          message: "Halo, saya ingin bertanya tentang Floating Market Lembang", 
          url: "https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20Floating%20Market%20Lembang" 
        },
        order: 10,
      },
      {
        type: "social",
        title: "Email",
        data: { 
          platform: "email", 
          handle: "floatingmarket1@gmail.com", 
          url: "mailto:floatingmarket1@gmail.com" 
        },
        order: 11,
      },
      {
        type: "text",
        title: "Info Tambahan",
        data: { text: "✨ Tiket masuk tersedia di lokasi\n🚗 Parkir tersedia untuk kendaraan pribadi\n🍽️ Berbagai pilihan kuliner dan minuman\n👨‍👩‍👧‍👦 Cocok untuk wisata keluarga\n📱 Follow Instagram kami untuk update terbaru" },
        order: 12,
      },
    ];

    let blocksCreated = 0;
    for (const block of blocks) {
      const blockId = randomBytes(16).toString('hex');
      try {
        await db`
          INSERT INTO blocks (id, profile_id, type, data_json, "order", is_visible, created_at)
          VALUES (
            ${blockId}, ${profileId}, ${block.type}, 
            ${JSON.stringify(block.data)}, ${block.order}, TRUE, NOW()
          )
        `;
        console.log(`   ✅ Block ${blocksCreated + 1}: ${block.type} - "${block.title}"`);
        blocksCreated++;
      } catch (blockError) {
        console.log(`   ⚠️  Block ${blocksCreated + 1} (${block.type}) failed: ${blockError.message}`);
      }
    }

    console.log("\n---");
    console.log("✅ Floating Market Lembang account creation completed!");
    console.log(`\n📊 Summary:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Blocks created: ${blocksCreated}/${blocks.length}`);
    console.log(`   Category: ${userData.category}`);
    console.log(`\n🔗 Profile URL: https://qrkan.com/@${userData.username}`);
    console.log(`\n✨ User can now login with:`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);

  } catch (error) {
    console.error("\n❌ Error creating Floating Market user:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  } finally {
    await db.end();
  }
}

createFloatingMarket()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Script to create STIFIn user account with content
 * Usage: node scripts/create-stifin.mjs
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

// STIFIn user data
const userData = {
  email: "STIFIn@gmail.com",
  password: "User!234",
  username: "stifin",
  displayName: "STIFIn Genetic Sumedang",
  bio: "Kenali Diri, Maksimalkan Potensi Anda! Tes STIFIn membantu Anda menemukan kekuatan dan kelemahan genetik untuk meraih kesuksesan yang lebih besar.",
  category: "Edukasi, Konsultasi",
};

async function createSTIFIn() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const db = postgres(connectionString, { prepare: false });

  try {
    console.log("🔄 Creating STIFIn user account...");
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

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        console.log("ℹ️  User already exists in Auth. Using existing user...");
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === userData.email);
        if (!user) {
          throw new Error("User exists but could not be retrieved");
        }
        authData.user = user;
      } else {
        throw authError;
      }
    }

    if (!authData?.user) {
      throw new Error("Failed to create or retrieve user");
    }

    const userId = authData.user.id;
    console.log(`✅ User created in Auth with ID: ${userId}`);

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
        title: "STIFIn Genetic",
        data: { heading: "STIFIn Genetic", size: "large" },
        order: 0,
      },
      {
        type: "text",
        title: "Apa Itu STIFIn?",
        data: { text: "STIFIn adalah metode tes psikologi berbasis analisis sidik jari yang unik, dirancang untuk mengidentifikasi kecerdasan dan karakter Anda. Dengan memahami lima mesin kecerdasan: Sensing, Thinking, Intuiting, Feeling, dan Instinct, STIFIn membantu Anda mengenali potensi diri, memilih karir yang tepat, dan meningkatkan komunikasi dalam berbagai aspek kehidupan." },
        order: 1,
      },
      {
        type: "heading",
        title: "Siapa yang Perlu Tes STIFIn?",
        data: { heading: "Siapa yang Perlu Tes STIFIn?", size: "medium" },
        order: 2,
      },
      {
        type: "text",
        title: "Target Audience",
        data: { text: "• Pelajar dan Mahasiswa - Temukan metode belajar yang sesuai\n• Pekerja dan Profesional - Pahami kekuatan di tempat kerja\n• Orang Tua - Mengerti tipe kecerdasan anak\n• Pendidik dan Guru - Sesuaikan metode pengajaran\n• Pasangan atau Keluarga - Tingkatkan komunikasi\n• Pengusaha dan Manajer - Maksimalkan produktivitas tim" },
        order: 3,
      },
      {
        type: "heading",
        title: "3 Keunggulan Tes STIFIn",
        data: { heading: "3 Keunggulan Tes STIFIn", size: "medium" },
        order: 4,
      },
      {
        type: "text",
        title: "Keunggulan",
        data: { text: "✅ AKURAT - Tingkat validitas dan reliabilitas sebesar 95%, 1X SEUMUR HIDUP\n✅ SIMPLE - Terbagi menjadi 5 Mesin Kecerdasan dan 9 Personaliti Genetik, FOKUS-SATU-HEBAT\n✅ APLIKATIF - Bersifat berkolerasi dengan berbagai aspek kehidupan atau MULTI-ANGLE-FIELD" },
        order: 5,
      },
      {
        type: "heading",
        title: "Paket Layanan",
        data: { heading: "Paket Layanan", size: "medium" },
        order: 6,
      },
      {
        type: "text",
        title: "Paket Personal",
        data: { text: "💰 Paket Personal - Rp 750.000\n• Tes untuk 1 Orang\n• E-Sertifikat\n• E-Book Penjelasan hasil tes\n• Sesi penjelasan konsep dasar STIFIn\n• Sesi diskusi, sharing dan tanya jawab\n• Free Konsultasi selama 3 bulan" },
        order: 7,
      },
      {
        type: "text",
        title: "Paket Family",
        data: { text: "💰 Paket Family - Rp 700.000/Orang (3-5 Orang)\n• E-Sertifikat\n• E-Book Penjelasan hasil tes\n• Sesi penjelasan konsep dasar STIFIn\n• Sesi diskusi, sharing & tanya jawab\n• Tips bagaimana mengarahkan anak\n• Penjelasan cara komunikasi efektif\n• Free Konsultasi selama 3 bulan" },
        order: 8,
      },
      {
        type: "text",
        title: "Paket Collective",
        data: { text: "💰 Paket Collective - Rp 650.000/Orang (6-10 Orang)\n• E-Sertifikat\n• E-Book Penjelasan hasil tes\n• Sesi penjelasan konsep dasar STIFIn\n• Sesi diskusi, sharing dan tanya jawab\n• Free Konsultasi selama 3 bulan\n\n💰 Paket > 10 Orang - Rp 600.000/Orang\n💰 Instansi & Lembaga - Special Price" },
        order: 9,
      },
      {
        type: "heading",
        title: "Kontak",
        data: { heading: "Kontak", size: "medium" },
        order: 10,
      },
      {
        type: "link",
        title: "Website",
        data: { title: "🌐 Website STIFIn", url: "https://stifingeneticsmd.com" },
        order: 11,
      },
      {
        type: "link",
        title: "Test STIFIn",
        data: { title: "🧪 Test STIFIn", url: "https://stifingeneticsmd.com" },
        order: 12,
      },
      {
        type: "whatsapp",
        title: "WhatsApp",
        data: { phone: "081234567890", message: "Halo, saya tertarik dengan Tes STIFIn", url: "https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20dengan%20Tes%20STIFIn" },
        order: 13,
      },
      {
        type: "social",
        title: "Email",
        data: { platform: "email", handle: "STIFIn@gmail.com", url: "mailto:STIFIn@gmail.com" },
        order: 14,
      },
      {
        type: "text",
        title: "Branch Manager",
        data: { text: "Nizar Dangkua\nBranch Manager STIFIn Genetic Indonesia\nCabang Sumedang\n\nDengan pengalaman dalam pengembangan diri dan pemetaan kecerdasan genetik, siap membantu Anda menemukan dan mengoptimalkan potensi terbaik Anda." },
        order: 15,
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
    console.log("✅ STIFIn account creation completed!");
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
    console.error("\n❌ Error creating STIFIn user:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  } finally {
    await db.end();
  }
}

createSTIFIn()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


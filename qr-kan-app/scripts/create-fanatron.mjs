#!/usr/bin/env node

/**
 * Script to create FANATRON user account with HTML block content
 * Usage: node scripts/create-fanatron.mjs
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
  console.warn("⚠️  .env.local not found, using existing env vars");
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

// FANATRON user data
const userData = {
  email: "info@fanatron.co.id",
  password: "Fanatron!234",
  username: "fanatron",
  displayName: "FANATRON - CV. Abdi Tunggal Perkasa",
  bio: "FANATRON adalah brand dari CV. Abdi Tunggal Perkasa - perusahaan engineering industri yang berfokus pada testing equipment, automation, robotics, drones, dan digital transformation. Industrial Engineering & Intelligent Systems sejak 2004.",
  category: "Manufaktur, Engineering",
};

// Baca HTML konten dari file di folder "html edit"
// Path relatif dari qr-kan-app/scripts ke root project
const htmlPath = join(__dirname, "../../html edit/fanatron.html");
console.log(`📄 Reading HTML file: ${htmlPath}`);

let htmlContent = "";
try {
  htmlContent = readFileSync(htmlPath, "utf-8");
  console.log(`✅ HTML file loaded (${htmlContent.length} chars)`);
} catch (err) {
  console.error(`❌ Error reading HTML file: ${err.message}`);
  console.error("   Trying fallback path...");
  try {
    const fallbackPath = join(__dirname, "../../fanatron.html");
    htmlContent = readFileSync(fallbackPath, "utf-8");
    console.log(`✅ HTML loaded from fallback (${htmlContent.length} chars)`);
  } catch (err2) {
    console.error(`❌ Fallback also failed: ${err2.message}`);
    process.exit(1);
  }
}

async function createFANATRON() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const db = postgres(connectionString, { prepare: false });

  try {
    console.log("\n🔄 Creating FANATRON user account...");
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
          'corporate', FALSE, NOW()
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
              'corporate', FALSE, NOW()
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

    // Step 4: Delete existing htmltext blocks (if any) and create new html block
    console.log("\n4️⃣ Creating HTML block...");

    // Delete existing htmltext blocks for this profile
    try {
      await db`DELETE FROM blocks WHERE profile_id = ${profileId} AND type = 'htmltext'`;
      console.log("   🗑️  Deleted existing htmltext blocks");
    } catch (deleteError) {
      console.log("   ℹ️  No existing htmltext blocks to delete");
    }

    // Insert new html block
    const blockId = randomBytes(16).toString('hex');
    try {
      await db`
        INSERT INTO blocks (id, profile_id, type, data_json, "order", is_visible, created_at)
        VALUES (
          ${blockId}, ${profileId}, 'htmltext',
          ${JSON.stringify({ htmlContent: htmlContent })}, 0, TRUE, NOW()
        )
      `;
      console.log(`✅ HTML block created with ID: ${blockId}`);
    } catch (blockError) {
      console.error(`❌ Block creation failed: ${blockError.message}`);
      throw blockError;
    }

    console.log("\n---");
    console.log("✅ FANATRON account creation completed!");
    console.log(`\n📊 Summary:`);
    console.log(`   User ID:        ${userId}`);
    console.log(`   Email:          ${userData.email}`);
    console.log(`   Username:       ${userData.username}`);
    console.log(`   Profile ID:     ${profileId}`);
    console.log(`   Block ID:       ${blockId}`);
    console.log(`   HTML chars:     ${htmlContent.length}`);
    console.log(`   Category:       ${userData.category}`);
    console.log(`\n🔗 Profile URL: https://qrkan.com/@${userData.username}`);
    console.log(`\n✨ User can now login with:`);
    console.log(`   Email:          ${userData.email}`);
    console.log(`   Password:       ${userData.password}`);

  } catch (error) {
    console.error("\n❌ Error creating FANATRON user:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  } finally {
    await db.end();
  }
}

createFANATRON()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
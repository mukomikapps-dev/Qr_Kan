#!/usr/bin/env node

/**
 * Script untuk membuat akun FANATRON langsung ke database PostgreSQL
 * (tanpa Supabase Auth API — karena API sedang restricted)
 *
 * Usage: node scripts/create-fanatron-direct.mjs
 */

import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomBytes, randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variable dari .env.local
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
  console.warn("⚠️  .env.local not found");
}

const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

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

// Read HTML content
const htmlPath = join(__dirname, "../../html edit/fanatron.html");
let htmlContent = "";
try {
  htmlContent = readFileSync(htmlPath, "utf-8");
  console.log(`✅ HTML file loaded (${htmlContent.length} chars)`);
} catch (err) {
  console.error(`❌ Error reading HTML file: ${err.message}`);
  process.exit(1);
}

async function main() {
  const db = postgres(connectionString, { prepare: false });

  // Use let for userId - may be reassigned if user already exists
  let userId = randomUUID();
  let profileId = randomBytes(16).toString("hex");
  let blockId = randomBytes(16).toString("hex");

  try {
    console.log("\n🔄 Creating FANATRON account (direct DB)...");
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log("---");

    // Step 1: Check if auth user already exists, else insert
    console.log("1️⃣ Checking auth.users...");
    const existingAuth = await db`
      SELECT id::text FROM auth.users WHERE email = ${userData.email} LIMIT 1
    `;

    if (existingAuth.length > 0) {
      userId = existingAuth[0].id;
      console.log(`ℹ️  Auth user already exists, using ID: ${userId}`);
    } else {
      try {
        await db`
          INSERT INTO auth.users (
            id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at
          )
          VALUES (
            ${userId}, 'authenticated', 'authenticated', ${userData.email},
            crypt(${userData.password}, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            ${JSON.stringify({ username: userData.username, display_name: userData.displayName })},
            NOW(), NOW()
          )
        `;
        console.log(`✅ Auth user created with ID: ${userId}`);
      } catch (authError) {
        if (authError.message.includes("duplicate") || authError.message.includes("already exists")) {
          console.log("ℹ️  Auth user already exists, fetching ID...");
          const existing2 = await db`
            SELECT id::text FROM auth.users WHERE email = ${userData.email} LIMIT 1
          `;
          if (existing2.length > 0) {
            userId = existing2[0].id;
            console.log(`✅ Using existing auth user ID: ${userId}`);
          } else {
            throw authError;
          }
        } else {
          throw authError;
        }
      }
    }

    // Step 2: Insert into public.users
    console.log("\n2️⃣ Inserting into public.users...");
    await db`
      INSERT INTO users (id, email, is_pro, created_at)
      VALUES (${userId}, ${userData.email}, FALSE, NOW())
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    `;
    console.log("✅ public.users inserted");

    // Step 3: Insert profile
    console.log("\n3️⃣ Creating profile...");
    try {
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
      if (profileError.message.includes("category") || profileError.code === "42703") {
        console.log("ℹ️  Column category doesn't exist, creating profile without...");
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
        try {
          await db`
            INSERT INTO profile_categories (profile_id, category, created_at)
            VALUES (${profileId}, ${userData.category}, NOW())
            ON CONFLICT (profile_id) DO UPDATE SET category = EXCLUDED.category
          `;
          console.log("✅ Category saved to profile_categories");
        } catch (catErr) {
          console.log("⚠️  Could not save category:", catErr.message);
        }
      } else if (profileError.message.includes("duplicate") || profileError.message.includes("already exists")) {
        const existing = await db`
          SELECT id FROM profiles WHERE username = ${userData.username} LIMIT 1
        `;
        if (existing.length > 0) {
          profileId = existing[0].id;
          console.log(`ℹ️  Profile already exists, using ID: ${profileId}`);
        } else {
          throw profileError;
        }
      } else {
        throw profileError;
      }
    }

    // Step 4: Delete existing htmltext blocks and create new one
    console.log("\n4️⃣ Creating HTML block...");
    try {
      await db`DELETE FROM blocks WHERE profile_id = ${profileId} AND type = 'htmltext'`;
      console.log("   🗑️  Deleted existing htmltext blocks");
    } catch (e) {
      console.log("   ℹ️  No existing htmltext blocks");
    }

    await db`
      INSERT INTO blocks (id, profile_id, type, data_json, "order", is_visible, created_at)
      VALUES (
        ${blockId}, ${profileId}, 'htmltext',
        ${JSON.stringify({ htmlContent: htmlContent })}, 0, TRUE, NOW()
      )
    `;
    console.log(`✅ HTML block created: ${blockId}`);

    console.log("\n---");
    console.log("✅ FANATRON account created (direct DB)!");
    console.log(`\n📊 Summary:`);
    console.log(`   User ID:        ${userId}`);
    console.log(`   Email:          ${userData.email}`);
    console.log(`   Username:       ${userData.username}`);
    console.log(`   Password:       ${userData.password}`);
    console.log(`   Profile ID:     ${profileId}`);
    console.log(`   Block ID:       ${blockId}`);
    console.log(`   HTML chars:     ${htmlContent.length}`);
    console.log(`   Category:       ${userData.category}`);
    console.log(`\n🔗 Profile URL: https://qrkan.com/@${userData.username}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.details) console.error("Details:", error.details);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
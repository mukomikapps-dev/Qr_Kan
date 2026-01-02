#!/usr/bin/env node

/**
 * Script to create a new user account with email and password
 * Usage: node scripts/create-user.mjs
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // For admin operations
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  process.exit(1);
}

if (!connectionString) {
  console.error("❌ Error: POSTGRES_URL is required");
  process.exit(1);
}

// User data
const userData = {
  email: "sugeng.hariadi@gmail.com",
  password: "Farhan!234",
  username: "sugenghariadi", // Derived from email
  displayName: "Sugeng Hariadi",
};

async function createUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const db = postgres(connectionString, { prepare: false });

  try {
    console.log("🔄 Creating new user account...");
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log("---");

    // Step 1: Create user in Supabase Auth
    console.log("1️⃣ Creating user in Supabase Auth...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: userData.username,
        display_name: userData.displayName,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        console.log("ℹ️  User already exists in Auth. Using existing user...");
        // Try to get existing user
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
    const profileId = randomBytes(16).toString('hex');
    
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
          'Selamat datang di profil saya!', NULL, NULL, 
          TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
          'monochrome', FALSE, NOW()
        )
        ON CONFLICT (username) DO UPDATE SET 
          display_name = EXCLUDED.display_name,
          bio = EXCLUDED.bio
      `;
      console.log(`✅ Profile created with ID: ${profileId}`);
    } catch (profileError) {
      if (profileError.message.includes("already exists") || profileError.message.includes("duplicate")) {
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

    // Step 4: Create 3 simple content blocks
    console.log("\n4️⃣ Creating content blocks...");
    
    const blocks = [
      {
        type: "heading",
        title: "Selamat Datang",
        data: { heading: "Selamat Datang", size: "large" },
        order: 0,
      },
      {
        type: "text",
        title: "Tentang Saya",
        data: { text: "Halo! Saya Sugeng Hariadi. Selamat datang di profil digital saya." },
        order: 1,
      },
      {
        type: "link",
        title: "Website",
        data: { title: "Kunjungi Website", url: "https://example.com" },
        order: 2,
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
    console.log("✅ Account creation completed!");
    console.log(`\n📊 Summary:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Blocks created: ${blocksCreated}/3`);
    console.log(`   Status: FREE (default)`);
    console.log(`\n🔗 Profile URL: /u/${userData.username}`);
    console.log(`\n✨ User can now login with:`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);

  } catch (error) {
    console.error("\n❌ Error creating user:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  } finally {
    await db.end();
  }
}

createUser()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


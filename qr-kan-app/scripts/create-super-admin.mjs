#!/usr/bin/env node

/**
 * Script to create a super admin user account
 * Usage: node scripts/create-super-admin.mjs
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

// Super Admin data
const adminData = {
  email: "superadmin@qrkan.com",
  password: "SuperAdminSuperAdmin!234",
  username: "superadmin",
  displayName: "Super Admin",
};

async function createSuperAdmin() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const db = postgres(connectionString, { prepare: false });

  try {
    console.log("🔄 Creating super admin account...");
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Username: ${adminData.username}`);
    console.log("---");

    // Step 1: Create user in Supabase Auth
    console.log("1️⃣ Creating user in Supabase Auth...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: adminData.username,
        display_name: adminData.displayName,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        console.log("ℹ️  User already exists in Auth. Using existing user...");
        // Try to get existing user
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === adminData.email);
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

    // Step 2: Create user in database with isSuperAdmin = true
    console.log("\n2️⃣ Creating super admin in database...");
    try {
      // Try with isSuperAdmin column
      await db`
        INSERT INTO users (id, email, is_pro, is_super_admin, created_at)
        VALUES (${userId}, ${adminData.email}, FALSE, TRUE, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          is_super_admin = TRUE
      `;
      console.log("✅ Super admin created in database");
    } catch (dbError) {
      // If isSuperAdmin column doesn't exist, insert without it first
      if (dbError.message.includes("is_super_admin") || dbError.message.includes("column") && dbError.message.includes("does not exist")) {
        console.log("ℹ️  is_super_admin column doesn't exist yet. Creating user without it...");
        await db`
          INSERT INTO users (id, email, is_pro, created_at)
          VALUES (${userId}, ${adminData.email}, FALSE, NOW())
          ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        `;
        console.log("⚠️  User created but is_super_admin column doesn't exist.");
        console.log("   Please run migration: node scripts/run-migration.mjs migrations/add-super-admin.sql");
        console.log("   Then run: node scripts/set-super-admin.mjs " + adminData.email);
      } else if (dbError.message.includes("already exists") || dbError.message.includes("duplicate")) {
        console.log("ℹ️  User already exists in database. Updating to super admin...");
        // Try to update to super admin
        try {
          await db`
            UPDATE users 
            SET is_super_admin = TRUE 
            WHERE id = ${userId}
          `;
          console.log("✅ User updated to super admin");
        } catch (updateError) {
          if (updateError.message.includes("is_super_admin")) {
            console.log("⚠️  Cannot update - is_super_admin column doesn't exist.");
            console.log("   Please run migration first.");
          } else {
            throw updateError;
          }
        }
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
          ${profileId}, ${userId}, ${adminData.username}, ${adminData.displayName}, 
          'Super Admin Profile', NULL, NULL, 
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
          SELECT id FROM profiles WHERE username = ${adminData.username} LIMIT 1
        `;
        if (existingProfile.length > 0) {
          console.log(`✅ Using existing profile: ${existingProfile[0].id}`);
        } else {
          throw profileError;
        }
      } else {
        throw profileError;
      }
    }

    console.log("\n---");
    console.log("✅ Super Admin account creation completed!");
    console.log(`\n📊 Summary:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Status: SUPER ADMIN`);
    console.log(`\n🔗 Admin Login: /admin/login`);
    console.log(`\n✨ Login credentials:`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`\n⚠️  IMPORTANT: Keep these credentials secure!`);

  } catch (error) {
    console.error("\n❌ Error creating super admin:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  } finally {
    await db.end();
  }
}

createSuperAdmin()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


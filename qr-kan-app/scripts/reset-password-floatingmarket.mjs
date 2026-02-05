#!/usr/bin/env node

/**
 * Script to reset password for Floating Market user
 * Usage: node scripts/reset-password-floatingmarket.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  process.exit(1);
}

const email = "floatingmarket1@gmail.com";
const newPassword = "User!234";

async function resetPassword() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

  try {
    console.log("🔄 Resetting password for Floating Market user...");
    console.log(`   Email: ${email}`);
    console.log("---");

    // Step 1: Get user by email
    console.log("1️⃣ Finding user...");
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`✅ User found: ${user.id}`);
    console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Step 2: Update password
    console.log("\n2️⃣ Updating password...");
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true, // Ensure email is confirmed
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log("✅ Password updated successfully");
    console.log("✅ Email confirmed");

    console.log("\n---");
    console.log("✅ Password reset completed!");
    console.log(`\n📊 Summary:`);
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`\n✨ User can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error("\n❌ Error resetting password:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  }
}

resetPassword()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });

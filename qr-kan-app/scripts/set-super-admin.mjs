#!/usr/bin/env node

/**
 * Script to set a user as super admin
 * Usage: node scripts/set-super-admin.mjs <email>
 */

import postgres from "postgres";
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

const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("❌ Error: POSTGRES_URL is required");
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Error: Email is required");
  console.error("Usage: node scripts/set-super-admin.mjs <email>");
  process.exit(1);
}

async function setSuperAdmin() {
  const client = postgres(connectionString, { prepare: false });
  
  try {
    console.log(`🔄 Setting user ${email} as super admin...`);
    
    // Update user
    const result = await client`
      UPDATE users 
      SET is_super_admin = TRUE 
      WHERE email = ${email}
      RETURNING id, email, is_super_admin
    `;
    
    if (result.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log("✅ User set as super admin successfully!");
    console.log(`\n📊 User Details:`);
    console.log(`   ID: ${result[0].id}`);
    console.log(`   Email: ${result[0].email}`);
    console.log(`   Super Admin: ${result[0].is_super_admin}`);
    console.log(`\n🔗 Admin Login: /admin/login`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

setSuperAdmin()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });





#!/usr/bin/env node

/**
 * Script to run database migration for adding is_pro column
 * Usage: node scripts/run-migration.mjs
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
  // .env.local might not exist, that's OK if env vars are set elsewhere
}

// Get connection string from environment
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("❌ Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable is required");
  console.error("   Make sure you have .env.local file with POSTGRES_URL set");
  process.exit(1);
}

// Read migration SQL file
const migrationPath = join(__dirname, "../migrations/add-is-pro.sql");
let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, "utf-8");
} catch (error) {
  console.error(`❌ Error reading migration file: ${migrationPath}`);
  console.error(error.message);
  process.exit(1);
}

async function runMigration() {
  const client = postgres(connectionString, { prepare: false });
  
  try {
    console.log("🔄 Running migration: add-is-pro.sql");
    console.log("---");
    
    // Execute the migration SQL
    // Remove comments and split by semicolon
    const cleanSQL = migrationSQL
      .split("\n")
      .map(line => {
        // Remove inline comments
        const commentIndex = line.indexOf("--");
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join("\n");
    
    // Split by semicolon, but be careful with nested statements
    const statements = cleanSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        const preview = statement.substring(0, 80).replace(/\s+/g, " ");
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
        try {
          await client.unsafe(statement);
          console.log(`✅ Statement ${i + 1} completed`);
        } catch (error) {
          // If column already exists, that's OK
          if (error.message.includes("already exists") || 
              error.message.includes("duplicate column")) {
            console.log(`ℹ️  Statement ${i + 1}: Column may already exist (OK)`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log("---");
    console.log("✅ Migration completed successfully!");
    console.log("✅ Column 'is_pro' has been added to 'users' table");
    console.log("✅ User 'mangugeng' has been set as pro user");
    
    // Verify the migration - check if column exists first
    console.log("\n🔍 Verifying migration...");
    
    // Check if column exists
    const columnCheck = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_pro'
    `;
    
    if (columnCheck.length === 0) {
      console.log("⚠️  Column 'is_pro' not found. Migration may have failed.");
      return;
    }
    
    console.log("✅ Column 'is_pro' exists in 'users' table");
    
    // Now check users
    const result = await client`
      SELECT u.id, u.email, u.is_pro, p.username
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE p.username = 'mangugeng' OR u.is_pro = true
      LIMIT 10
    `;
    
    if (result.length > 0) {
      console.log("\n📊 Users with pro status:");
      result.forEach(user => {
        const username = user.username || "N/A";
        const email = user.email || "N/A";
        const isPro = user.is_pro ? "✅ PRO" : "❌ FREE";
        console.log(`  - ${username} (${email}): ${isPro}`);
      });
    } else {
      console.log("⚠️  No users found with username 'mangugeng'");
      console.log("   This is OK if the user doesn't exist yet.");
    }
    
  } catch (error) {
    console.error("\n❌ Migration failed!");
    console.error("Error:", error.message);
    
    // Check if column already exists
    if (error.message.includes("already exists") || 
        error.message.includes("duplicate column") ||
        error.message.includes("column \"is_pro\" of relation \"users\" already exists")) {
      console.log("\nℹ️  Column 'is_pro' may already exist. Checking current state...");
      
      try {
        const checkResult = await client`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'is_pro'
        `;
        
        if (checkResult.length > 0) {
          console.log("✅ Column 'is_pro' already exists in 'users' table");
          console.log("🔄 Attempting to update user 'mangugeng' to pro...");
          
          // Try to update mangugeng to pro
          const updateResult = await client`
            UPDATE users 
            SET is_pro = TRUE 
            WHERE id IN (
              SELECT u.id 
              FROM users u
              JOIN profiles p ON u.id = p.user_id
              WHERE p.username = 'mangugeng'
            )
            RETURNING id
          `;
          
          if (updateResult.length > 0) {
            console.log(`✅ Updated ${updateResult.length} user(s) to pro status`);
          } else {
            console.log("⚠️  No user with username 'mangugeng' found to update");
          }
        }
      } catch (checkError) {
        console.error("Error checking column:", checkError.message);
      }
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n✨ Migration process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


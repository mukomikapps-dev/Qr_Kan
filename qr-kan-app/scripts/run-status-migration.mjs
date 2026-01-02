#!/usr/bin/env node

/**
 * Script to run database migration for adding status columns
 * Usage: node scripts/run-status-migration.mjs
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
const migrationPath = join(__dirname, "../migrations/add-status.sql");
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
    console.log("🔄 Running migration: add-status.sql");
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
    console.log("✅ Columns 'status' and 'status_type' have been added to 'profiles' table");
    
    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    
    // Check if columns exist
    const columnCheck = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('status', 'status_type')
      ORDER BY column_name
    `;
    
    if (columnCheck.length === 0) {
      console.log("⚠️  Columns 'status' and 'status_type' not found. Migration may have failed.");
      return;
    }
    
    console.log("✅ Columns found in 'profiles' table:");
    columnCheck.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if index exists
    const indexCheck = await client`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'profiles' 
      AND indexname = 'idx_profiles_status'
    `;
    
    if (indexCheck.length > 0) {
      console.log("✅ Index 'idx_profiles_status' exists");
    } else {
      console.log("ℹ️  Index 'idx_profiles_status' not found (optional)");
    }
    
  } catch (error) {
    console.error("\n❌ Migration failed!");
    console.error("Error:", error.message);
    
    // Check if columns already exist
    if (error.message.includes("already exists") || 
        error.message.includes("duplicate column")) {
      console.log("\nℹ️  Columns may already exist. Checking current state...");
      
      try {
        const checkResult = await client`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'profiles' 
          AND column_name IN ('status', 'status_type')
          ORDER BY column_name
        `;
        
        if (checkResult.length > 0) {
          console.log("✅ Columns already exist in 'profiles' table:");
          checkResult.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
          });
        }
      } catch (checkError) {
        console.error("Error checking columns:", checkError.message);
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





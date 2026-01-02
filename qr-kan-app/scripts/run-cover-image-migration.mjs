#!/usr/bin/env node

/**
 * Script to run cover_image_url migration
 * Usage: node scripts/run-cover-image-migration.mjs
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

// Read migration SQL
const migrationPath = join(__dirname, "../migrations/add-cover-image.sql");
let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, "utf-8");
} catch (error) {
  console.error(`❌ Error: Could not read migration file at ${migrationPath}`);
  console.error(error.message);
  process.exit(1);
}

async function runMigration() {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  
  try {
    console.log("🔄 Running migration: add-cover-image.sql");
    console.log("---");
    
    // Remove comments and split by semicolon
    const cleanSQL = migrationSQL
      .split("\n")
      .map(line => {
        const commentIndex = line.indexOf("--");
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join("\n");
    
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
          if (error.message.includes("already exists") || 
              error.message.includes("duplicate column") ||
              error.message.includes("IF NOT EXISTS")) {
            console.log(`ℹ️  Statement ${i + 1}: May already exist (OK)`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log("---");
    console.log("✅ Migration completed successfully!");
    console.log("✅ Column 'cover_image_url' has been added to 'profiles' table");
    
    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    const columnCheck = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'cover_image_url'
    `;
    
    if (columnCheck.length === 0) {
      console.log("⚠️  Column 'cover_image_url' not found. Migration may have failed.");
      return;
    }
    
    console.log("✅ Column 'cover_image_url' exists in 'profiles' table");
    console.log(`   Type: ${columnCheck[0].data_type}`);
    
  } catch (error) {
    console.error("\n❌ Migration failed!");
    console.error(error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    throw error;
  } finally {
    await client.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });


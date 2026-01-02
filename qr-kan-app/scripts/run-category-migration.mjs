#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
try {
  const envPath = join(__dirname, '../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  // .env.local file might not exist, that's OK
}

// Get connection string from environment
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable is required');
  console.error('   Please set it in your .env file or export it in your shell');
  process.exit(1);
}

// Read migration SQL
const migrationPath = join(__dirname, '..', 'migrations', 'add-profile-category-step1.sql');
let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
} catch (error) {
  console.error(`❌ Error reading migration file: ${migrationPath}`);
  console.error(error.message);
  process.exit(1);
}

async function runMigration() {
  const client = postgres(connectionString, { 
    prepare: false,
    max: 1,
  });
  
  try {
    console.log("🔄 Running migration: add-profile-category-step1.sql");
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
    console.log("✅ Column 'category' has been added to 'profiles' table");
    
    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    const columnCheck = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'category'
    `;
    
    if (columnCheck.length === 0) {
      console.log("⚠️  Column 'category' not found. Migration may have failed.");
      return;
    }
    
    console.log("✅ Column 'category' exists in 'profiles' table");
    console.log(`   Type: ${columnCheck[0].data_type}`);
    
    console.log("\n💡 Next step: Create index manually in Supabase SQL Editor:");
    console.log("   CREATE INDEX CONCURRENTLY idx_profiles_category ON profiles(category) WHERE category IS NOT NULL;");
    
  } catch (error) {
    console.error("\n❌ Migration failed!");
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();


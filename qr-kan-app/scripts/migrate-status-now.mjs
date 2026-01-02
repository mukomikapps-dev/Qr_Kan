#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, '../.env.local');
let connectionString = null;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key.trim() === 'POSTGRES_URL' || key.trim() === 'POSTGRES_URL_NON_POOLING') {
          connectionString = value.trim();
        }
      }
    }
  });
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

if (!connectionString) {
  console.error('❌ POSTGRES_URL or POSTGRES_URL_NON_POOLING not found in .env.local');
  console.error('   Please make sure .env.local exists and contains POSTGRES_URL');
  process.exit(1);
}

console.log('🔄 Running migration: add-status.sql');
console.log('---');

const sql = postgres(connectionString, { prepare: false });

try {
  // Add status column
  console.log('[1/3] Adding status column...');
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT`;
  console.log('✅ Status column added');
  
  // Add status_type column
  console.log('[2/3] Adding status_type column...');
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'text'`;
  console.log('✅ Status_type column added');
  
  // Create index
  console.log('[3/3] Creating index...');
  await sql`CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status) WHERE status IS NOT NULL`;
  console.log('✅ Index created');
  
  // Verify
  console.log('\n🔍 Verifying migration...');
  const check = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name IN ('status', 'status_type')
    ORDER BY column_name
  `;
  
  console.log('\n✅ Migration completed successfully!');
  console.log('Columns found:');
  check.forEach(col => {
    console.log(`   - ${col.column_name} (${col.data_type}, default: ${col.column_default || 'NULL'})`);
  });
  
  await sql.end();
  console.log('\n✨ Done!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed!');
  console.error('Error:', error.message);
  
  // Check if columns already exist
  if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
    console.log('\nℹ️  Columns may already exist. Checking...');
    try {
      const check = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('status', 'status_type')
      `;
      if (check.length > 0) {
        console.log('✅ Columns already exist:');
        check.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        console.log('\n✨ Migration already completed!');
      }
    } catch (checkError) {
      console.error('Error checking columns:', checkError.message);
    }
  }
  
  await sql.end();
  process.exit(1);
}





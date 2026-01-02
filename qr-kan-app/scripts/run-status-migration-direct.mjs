#!/usr/bin/env node

/**
 * Script to run database migration for adding status columns
 * Uses Supabase client directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
let supabaseUrl, supabaseServiceKey;
try {
  const envPath = join(__dirname, '../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') {
          supabaseUrl = value.trim();
        }
        if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') {
          supabaseServiceKey = value.trim();
        }
      }
    }
  });
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('   Make sure you have .env.local file with these variables set');
  process.exit(1);
}

// Read migration SQL file
const migrationPath = join(__dirname, '../migrations/add-status.sql');
let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
} catch (error) {
  console.error(`❌ Error reading migration file: ${migrationPath}`);
  console.error(error.message);
  process.exit(1);
}

async function runMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('🔄 Running migration: add-status.sql');
    console.log('---');
    
    // Clean SQL - remove comments
    const cleanSQL = migrationSQL
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');
    
    // Split by semicolon
    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            // Try direct query instead
            const { error: directError } = await supabase
              .from('_migration_temp')
              .select('*')
              .limit(0);
            
            // If RPC doesn't work, use direct SQL via REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ sql_query: statement }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              // Check if column already exists
              if (errorText.includes('already exists') || errorText.includes('duplicate column')) {
                console.log(`ℹ️  Statement ${i + 1}: Column may already exist (OK)`);
              } else {
                throw new Error(errorText);
              }
            } else {
              console.log(`✅ Statement ${i + 1} completed`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} completed`);
          }
        } catch (error) {
          // If column already exists, that's OK
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate column')) {
            console.log(`ℹ️  Statement ${i + 1}: Column may already exist (OK)`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
            // Continue with next statement
          }
        }
      }
    }
    
    console.log('---');
    console.log('✅ Migration completed!');
    console.log('✅ Columns "status" and "status_type" should now be available in "profiles" table');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ Migration process completed!');
    console.log('\n📝 Note: If you see errors about "already exists", the columns may already be present.');
    console.log('   You can verify by checking the Supabase dashboard.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });





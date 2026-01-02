import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const results: Array<{ statement: string; status: string }> = [];

    // Step 1: Add category column
    try {
      await db.execute(sql`
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS category TEXT;
      `);
      results.push({ 
        statement: 'ALTER TABLE profiles ADD COLUMN category...', 
        status: 'success' 
      });
    } catch (error: any) {
      if (error.message?.includes('already exists') || 
          error.message?.includes('duplicate column') ||
          error.message?.includes('column "category" of relation "profiles" already exists')) {
        results.push({ 
          statement: 'ALTER TABLE profiles ADD COLUMN category...', 
          status: 'already_exists' 
        });
      } else {
        throw error;
      }
    }

    // Step 2: Skip index creation (can be done manually later to avoid timeout)
    results.push({ 
      statement: 'CREATE INDEX idx_profiles_category...', 
      status: 'skipped' 
    });

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully. Column added. Index can be created manually if needed.',
      results,
      note: 'Index creation was skipped to avoid timeout. You can create it manually in Supabase SQL Editor: CREATE INDEX CONCURRENTLY idx_profiles_category ON profiles(category) WHERE category IS NOT NULL;'
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        message: error.message || 'Unknown error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}


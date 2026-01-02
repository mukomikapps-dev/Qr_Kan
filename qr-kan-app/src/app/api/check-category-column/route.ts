import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if category column exists
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'category'
    `);

    const columnExists = result.length > 0;

    // Check if index exists
    let indexExists = false;
    try {
      const indexResult = await db.execute(sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_category'
      `);
      indexExists = indexResult.length > 0;
    } catch (error) {
      // Index check might fail, that's OK
    }

    return NextResponse.json({
      columnExists,
      indexExists,
      column: columnExists ? result[0] : null,
      message: columnExists 
        ? 'Column category already exists. Migration not needed.' 
        : 'Column category does not exist. Migration needed.',
      instructions: !columnExists ? {
        method: 'Supabase SQL Editor (Recommended)',
        steps: [
          '1. Open Supabase Dashboard → SQL Editor',
          '2. Set Statement Timeout to 600 seconds (10 minutes) or more',
          '3. Run this SQL:',
          '',
          'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category TEXT;',
          '',
          '4. Wait for completion (may take several minutes for large tables)',
          '5. Optional: Create index later:',
          '',
          'CREATE INDEX CONCURRENTLY idx_profiles_category ON profiles(category) WHERE category IS NOT NULL;'
        ]
      } : null
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Check failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}




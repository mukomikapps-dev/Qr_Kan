import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'POSTGRES_URL not configured' },
        { status: 500 }
      );
    }

    const sql = postgres(connectionString, { prepare: false });

    // Migration SQL
    const migrationSQL = `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS status TEXT,
      ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'text';

      CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status) WHERE status IS NOT NULL;
    `;

    // Execute migration
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const results: Array<{ statement: string; status: string }> = [];
    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
        results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
          results.push({ statement: statement.substring(0, 50) + '...', status: 'already_exists' });
        } else {
          throw error;
        }
      }
    }

    // Verify migration
    const checkResult = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('status', 'status_type')
      ORDER BY column_name
    `;

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      results,
      columns: checkResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Migration failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}


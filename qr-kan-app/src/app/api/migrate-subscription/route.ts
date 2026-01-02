import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getCurrentAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Check admin auth
    const admin = await getCurrentAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
-- Add subscription columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  moota_transaction_id TEXT,
  virtual_account TEXT,
  payment_method TEXT,
  expires_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for payment_requests
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_moota_transaction_id ON payment_requests(moota_transaction_id);

-- Update existing is_pro users to have pro subscription
UPDATE users 
SET subscription_tier = 'pro',
    subscription_status = 'active',
    subscription_start_date = created_at,
    subscription_end_date = created_at + INTERVAL '1 month'
WHERE is_pro = true AND (subscription_tier IS NULL OR subscription_tier = 'free');
    `;

    // Execute migration
    await sql.unsafe(migrationSQL);

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'Subscription migration completed successfully!',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Migration failed',
        details: error.detail || error.hint || null,
      },
      { status: 500 }
    );
  }
}





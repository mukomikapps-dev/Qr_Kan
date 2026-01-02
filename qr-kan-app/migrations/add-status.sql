-- Add status and status_type columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'text';

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status) WHERE status IS NOT NULL;





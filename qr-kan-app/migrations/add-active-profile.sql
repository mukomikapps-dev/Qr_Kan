-- Add active_profile_id column to users table (untuk multi-profile / profil aktif)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS active_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_active_profile_id ON users(active_profile_id);
-- Migration: Buat Tabel Mapping untuk Category
-- Jalankan di Supabase SQL Editor
-- Ini sangat cepat karena tidak perlu lock tabel profiles yang besar

-- Step 1: Buat tabel mapping
CREATE TABLE IF NOT EXISTS profile_categories (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_profile_categories_category 
ON profile_categories(category) 
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_categories_profile_id 
ON profile_categories(profile_id);

-- Step 3: Verifikasi (opsional)
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'profile_categories';

-- Setelah ini, fitur category akan langsung aktif!
-- Aplikasi sudah support fallback ke tabel ini.




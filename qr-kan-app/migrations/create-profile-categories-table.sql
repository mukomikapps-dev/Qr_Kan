-- Solusi Alternatif: Tabel mapping terpisah untuk category
-- Ini lebih cepat karena tidak perlu ALTER TABLE pada tabel profiles yang besar
-- Jalankan di Supabase SQL Editor

-- Step 1: Buat tabel mapping (sangat cepat, tidak ada lock pada tabel profiles)
CREATE TABLE IF NOT EXISTS profile_categories (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_profile_categories_category 
ON profile_categories(category) 
WHERE category IS NOT NULL;

-- Step 3: Buat index untuk profile_id (sudah ada dari PRIMARY KEY, tapi untuk memastikan)
CREATE INDEX IF NOT EXISTS idx_profile_categories_profile_id 
ON profile_categories(profile_id);

-- Catatan:
-- - Tabel ini akan digunakan sebagai alternatif jika kolom category tidak ada
-- - Aplikasi akan otomatis menggunakan tabel ini jika kolom category belum ada
-- - Nanti jika kolom category sudah berhasil ditambahkan, bisa migrate data dari tabel ini




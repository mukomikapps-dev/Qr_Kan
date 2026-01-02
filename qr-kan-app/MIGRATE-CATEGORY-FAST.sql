-- Migration cepat: Add category column (tanpa index dulu)
-- Jalankan di Supabase SQL Editor dengan timeout 600+ seconds

-- Step 1: Cek dulu apakah kolom sudah ada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'category';

-- Jika query di atas mengembalikan hasil, kolom sudah ada - SKIP migration
-- Jika tidak ada hasil, lanjutkan ke Step 2:

-- Step 2: Tambah kolom (tanpa default value untuk mempercepat)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Catatan: 
-- - Index bisa dibuat nanti secara terpisah jika diperlukan
-- - Query ini seharusnya lebih cepat karena tidak ada default value
-- - Jika masih timeout, tabel mungkin sangat besar - pertimbangkan untuk:
--   1. Menjalankan di waktu off-peak (traffic rendah)
--   2. Atau hubungi support Supabase untuk meningkatkan timeout




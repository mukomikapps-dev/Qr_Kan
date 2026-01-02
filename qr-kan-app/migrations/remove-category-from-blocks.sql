-- Migration: Hapus kolom category dari tabel blocks
-- Kolom category sudah dipindahkan ke profiles (dan profile_categories table)
-- Jalankan di Supabase SQL Editor

-- Step 1: Hapus kolom category dari tabel blocks
ALTER TABLE blocks 
DROP COLUMN IF EXISTS category;

-- Step 2: Hapus index jika ada (opsional, untuk cleanup)
DROP INDEX IF EXISTS idx_blocks_category;

-- Verifikasi (opsional)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'blocks' 
AND column_name = 'category';
-- Jika query ini tidak mengembalikan hasil, berarti kolom sudah berhasil dihapus

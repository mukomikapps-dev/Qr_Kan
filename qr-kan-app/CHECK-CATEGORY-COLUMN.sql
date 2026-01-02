-- Cek apakah kolom category sudah ada
-- Jalankan query ini di Supabase SQL Editor untuk mengecek status

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'category';

-- Jika query di atas mengembalikan hasil (ada 1 row), berarti kolom sudah ada
-- Jika tidak ada hasil (0 rows), berarti kolom belum ada dan perlu migration




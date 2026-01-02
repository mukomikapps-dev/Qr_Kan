# Migration: Tabel Mapping untuk Category

Karena `ALTER TABLE profiles ADD COLUMN category` timeout pada tabel besar, kita menggunakan **tabel mapping terpisah** sebagai solusi alternatif.

## ✅ Keuntungan Tabel Mapping

1. **Lebih cepat** - Tidak perlu lock tabel `profiles` yang besar
2. **Tidak timeout** - CREATE TABLE sangat cepat
3. **Fitur langsung aktif** - Aplikasi sudah support fallback ke tabel ini

## 📋 Langkah Migration

### Step 1: Jalankan SQL di Supabase SQL Editor

```sql
-- Buat tabel mapping (sangat cepat, tidak ada lock pada tabel profiles)
CREATE TABLE IF NOT EXISTS profile_categories (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_profile_categories_category 
ON profile_categories(category) 
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_categories_profile_id 
ON profile_categories(profile_id);
```

### Step 2: Verifikasi

```sql
-- Cek apakah tabel sudah dibuat
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'profile_categories';

-- Cek apakah index sudah dibuat
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'profile_categories';
```

## 🎯 Cara Kerja

1. **Saat menyimpan category:**
   - Jika kolom `profiles.category` ada → simpan ke kolom tersebut
   - Jika kolom tidak ada → simpan ke tabel `profile_categories`

2. **Saat membaca category:**
   - Coba baca dari `profiles.category` dulu
   - Jika kolom tidak ada → baca dari tabel `profile_categories`

3. **Filter category di explore page:**
   - Jika kolom ada → filter langsung di query
   - Jika kolom tidak ada → filter setelah query dari data `profile_categories`

## 📝 Catatan

- Tabel ini akan digunakan **otomatis** jika kolom `category` belum ada
- Nanti jika kolom `category` berhasil ditambahkan, bisa migrate data dari tabel ini ke kolom
- Aplikasi sudah support kedua cara (kolom atau tabel mapping)

## ✅ Status

Setelah migration ini, fitur category akan langsung aktif meskipun kolom `profiles.category` belum ada!




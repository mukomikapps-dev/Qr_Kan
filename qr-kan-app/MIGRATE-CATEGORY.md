# Migration: Add Category Column

Migration ini menambahkan kolom `category` ke tabel `profiles` untuk fitur grouping di explore page.

## ⚠️ Catatan Penting

Jika tabel `profiles` sangat besar, migration mungkin timeout. Gunakan **Opsi 1** (Supabase SQL Editor) yang paling reliable.

## Opsi 1: Via Supabase SQL Editor (DISARANKAN)

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Buka **SQL Editor**
4. **PENTING**: Di bagian bawah editor, set **Statement Timeout** ke **300 seconds** (5 menit) atau lebih
5. Copy dan paste SQL berikut:

```sql
-- Step 1: Add category column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category TEXT;
```

6. Klik **Run** untuk menjalankan migration
7. Tunggu hingga selesai (bisa memakan waktu beberapa menit untuk tabel besar)

8. **Optional - Step 2**: Setelah kolom berhasil ditambahkan, buat index (bisa dilakukan nanti):

```sql
-- Step 2: Create index (optional, bisa dilakukan nanti)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_category 
ON profiles(category) 
WHERE category IS NOT NULL;
```

**Catatan**: `CONCURRENTLY` memungkinkan index dibuat tanpa lock tabel, tapi hanya bisa digunakan di luar transaction.

## Opsi 2: Via API Endpoint

Jika tabel tidak terlalu besar, bisa menggunakan API endpoint:

1. Buka browser: `http://localhost:3000/migrate-category`
2. Klik tombol "Jalankan Migration"

**Catatan**: Jika timeout, kolom mungkin sudah ditambahkan. Cek di Supabase untuk memastikan.

## Opsi 3: Via Terminal Script

```bash
cd qr-kan-app
node scripts/run-category-migration.mjs
```

**Catatan**: Script ini mungkin timeout jika tabel sangat besar.

## Verifikasi

Setelah migration berjalan, verifikasi dengan query berikut di Supabase SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'category'
ORDER BY column_name;
```

Hasil yang diharapkan:
- `category` (TEXT, NULL)

## Troubleshooting

### Timeout Error
- **Solusi**: Gunakan Supabase SQL Editor dengan statement timeout yang lebih panjang (300+ seconds)
- Kolom mungkin sudah ditambahkan meskipun error timeout - cek dengan query verifikasi di atas

### Column Already Exists
- Ini normal jika migration sudah pernah dijalankan sebelumnya
- Fitur kategori akan langsung aktif

### Index Creation Timeout
- Index bisa dibuat nanti secara manual
- Fitur kategori tetap berfungsi tanpa index (hanya filter mungkin sedikit lebih lambat)

## Setelah Migration

Setelah kolom `category` berhasil ditambahkan:
1. Fitur kategori akan otomatis aktif di aplikasi
2. User bisa mengisi kategori di Dashboard → Profile → Edit Profile
3. Filter kategori akan muncul di halaman Explore




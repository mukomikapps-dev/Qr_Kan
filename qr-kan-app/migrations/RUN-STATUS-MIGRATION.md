# Migration: Add Status Columns

## Cara Menjalankan Migration

### Opsi 1: Via Supabase SQL Editor (Disarankan)

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy dan paste SQL berikut:

```sql
-- Add status and status_type columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'text';

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status) WHERE status IS NOT NULL;
```

5. Klik **Run** untuk menjalankan migration

### Opsi 2: Via Script (Jika environment variable sudah diset)

```bash
cd qr-kan-app
node scripts/run-status-migration.mjs
```

**Catatan:** Pastikan file `.env.local` berisi `POSTGRES_URL` atau `POSTGRES_URL_NON_POOLING` yang valid.

## Verifikasi

Setelah migration berjalan, verifikasi dengan query berikut:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('status', 'status_type');
```

Hasil yang diharapkan:
- `status` (TEXT, NULL)
- `status_type` (TEXT, DEFAULT 'text')

## Fitur yang Diaktifkan

Setelah migration ini, user dapat:
- ✅ Menambahkan status text di halaman profile
- ✅ Mengupload gambar status di halaman profile
- ✅ Status akan tampil di card explore
- ✅ Status akan tampil di halaman public profile





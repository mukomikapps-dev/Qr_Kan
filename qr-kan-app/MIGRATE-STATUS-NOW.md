# Migration Status - Cara Menjalankan

## Opsi 1: Via Terminal (Paling Cepat)

Jalankan script berikut di terminal:

```bash
cd qr-kan-app
node scripts/migrate-status-now.mjs
```

## Opsi 2: Via Supabase SQL Editor (Paling Reliable)

1. Buka Supabase Dashboard: https://supabase.com/dashboard
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

## Opsi 3: Via API Endpoint

Jika server development sedang berjalan, buka browser dan akses:

```
POST http://localhost:3000/api/migrate-status
```

Atau gunakan curl:

```bash
curl -X POST http://localhost:3000/api/migrate-status
```

## Verifikasi

Setelah migration berjalan, verifikasi dengan query berikut di Supabase SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('status', 'status_type')
ORDER BY column_name;
```

Hasil yang diharapkan:
- `status` (TEXT, NULL)
- `status_type` (TEXT, DEFAULT 'text')

## Catatan

- Migration ini aman untuk dijalankan berulang kali (menggunakan `IF NOT EXISTS`)
- Jika kolom sudah ada, migration akan diabaikan
- Setelah migration, fitur status akan aktif sepenuhnya





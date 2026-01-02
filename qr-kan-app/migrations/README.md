# Database Migrations

## Menjalankan Migrations

Jalankan file SQL ini di Supabase SQL Editor sesuai urutan:

1. **add-is-pro.sql** - Menambahkan kolom `is_pro` ke tabel `users` dan set user 'mangugeng' sebagai pro

## Cara Menjalankan

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Buka SQL Editor
4. Copy-paste isi file migration
5. Klik "Run" untuk menjalankan

## Migration: add-is-pro.sql

Menambahkan kolom `is_pro` ke tabel `users` dan set user dengan username 'mangugeng' sebagai pro user.

```sql
-- Add is_pro column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT FALSE;

-- Set user 'mangugeng' as pro user
UPDATE users 
SET is_pro = TRUE 
WHERE id IN (
  SELECT u.id 
  FROM users u
  JOIN profiles p ON u.id = p.user_id
  WHERE p.username = 'mangugeng'
);
```

# Hapus Kolom Category dari Tabel Blocks

## ✅ AMAN untuk Dihapus

Kolom `category` di tabel `blocks` sudah tidak digunakan lagi karena:
- Category sudah dipindahkan ke `profiles` (dan `profile_categories` table)
- Schema TypeScript sudah tidak memiliki `category` di `blocks`
- Tidak ada kode yang menggunakan `blocks.category`

## 📋 Cara Hapus via Supabase Table Editor

### Opsi 1: Via Table Editor (Paling Mudah)

1. Buka **Supabase Dashboard** → Pilih project
2. Klik **Table Editor** di sidebar kiri
3. Pilih tabel **`blocks`**
4. Klik kolom **`category`** (jika ada)
5. Klik tombol **Delete** atau **Remove Column**
6. Konfirmasi penghapusan

### Opsi 2: Via SQL Editor (Jika Table Editor tidak bisa)

Jika Table Editor juga timeout, coba dengan SQL yang lebih sederhana:

```sql
-- Hapus kolom category (tanpa IF EXISTS untuk menghindari timeout)
ALTER TABLE blocks DROP COLUMN category;
```

**Catatan:** Jika kolom tidak ada, query akan error, tapi itu tidak masalah.

### Verifikasi

Setelah menghapus, cek dengan query ini:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'blocks' 
AND column_name = 'category';
```

Jika tidak ada hasil = kolom sudah berhasil dihapus ✅

## ⚠️ Catatan

- Pastikan tidak ada data penting di kolom `category` sebelum dihapus
- Jika ada data, backup dulu jika diperlukan (tapi karena sudah tidak digunakan, seharusnya aman)
- Setelah dihapus, aplikasi akan tetap berjalan normal karena tidak menggunakan kolom ini




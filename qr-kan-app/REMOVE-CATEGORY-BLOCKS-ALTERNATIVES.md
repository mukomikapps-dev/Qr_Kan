# Solusi Alternatif: Hapus Kolom Category dari Blocks

## ⚠️ Masalah
`ALTER TABLE blocks DROP COLUMN category` timeout karena tabel besar.

## ✅ Solusi

### Opsi 1: Biarkan Saja (Paling Aman)
**Kolom `category` di `blocks` tidak digunakan sama sekali:**
- Schema TypeScript sudah tidak memiliki kolom ini
- Tidak ada kode yang menggunakan `blocks.category`
- Semua nilai NULL (tidak ada data penting)
- Tidak mempengaruhi performa aplikasi

**Kesimpulan:** Tidak masalah jika kolom tetap ada di database. Aplikasi tetap berjalan normal.

### Opsi 2: Hapus via Table Editor Definition Tab
1. Buka **Table Editor** → Pilih tabel `blocks`
2. Klik tab **"Definition"** (di bawah, sebelah kanan "Data")
3. Scroll ke kolom `category`
4. Klik ikon **trash/delete** di kolom tersebut
5. Konfirmasi

**Catatan:** Table Editor Definition tab biasanya lebih ringan daripada SQL Editor.

### Opsi 3: Coba di Waktu Off-Peak
- Jalankan di waktu traffic rendah (misalnya malam)
- Set Statement Timeout ke maksimal (1800+ seconds)
- Coba lagi

### Opsi 4: Hubungi Supabase Support
Jika benar-benar perlu dihapus, hubungi Supabase support untuk bantuan:
- Mereka bisa menjalankan migration dengan timeout lebih tinggi
- Atau memberikan solusi alternatif

### Opsi 5: Buat Tabel Baru (Advanced)
Jika benar-benar perlu, bisa:
1. Buat tabel `blocks_new` tanpa kolom `category`
2. Copy data dari `blocks` ke `blocks_new`
3. Rename tabel
4. Tapi ini kompleks dan tidak perlu karena kolom tidak digunakan

## 💡 Rekomendasi

**Biarkan saja kolom `category` tetap ada di tabel `blocks`.**

Alasan:
- ✅ Tidak mempengaruhi aplikasi (tidak digunakan)
- ✅ Tidak mempengaruhi performa (semua NULL)
- ✅ Tidak ada data penting yang hilang
- ✅ Menghindari risiko timeout/error
- ✅ Bisa dihapus nanti saat tabel lebih kecil atau di waktu off-peak

## 📝 Catatan

Kolom `category` di `blocks` adalah legacy column yang sudah tidak digunakan. Category sekarang disimpan di:
- `profiles.category` (jika kolom ada)
- `profile_categories` table (jika kolom tidak ada)

Jadi kolom `category` di `blocks` bisa diabaikan.




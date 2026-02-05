# Cara Mengubah Branding OAuth Login ke qrkan.com

Panduan untuk mengubah branding di halaman Google login agar menampilkan "qrkan.com" bukan "wcvtlsvlrjfftrkuekay.supabase.co".

## Masalah

Saat ini, halaman Google login menampilkan:
```
Sign in
to continue to wcvtlsvlrjfftrkuekay.supabase.co
```

Kita ingin menampilkan:
```
Sign in
to continue to qrkan.com
```

## Solusi

### 1. Update OAuth Consent Screen di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Buka **APIs & Services** → **OAuth consent screen**
4. Klik **Edit App** (jika sudah ada) atau **Create** (jika baru)

#### App Information

1. **App name**: `QR Kan`
2. **User support email**: Email Anda
3. **App logo**: Upload logo QR Kan (120x120px, opsional tapi recommended)
4. **Application home page**: `https://qrkan.com`
5. **Application privacy policy link**: `https://qrkan.com/privacy` (opsional)
6. **Application terms of service link**: `https://qrkan.com/terms` (opsional)
7. **Authorized domains**: **PENTING!** Tambahkan:
   ```
   qrkan.com
   www.qrkan.com
   ```
8. **Developer contact information**: Email Anda
9. Klik **Save and Continue**

#### Scopes

1. Pastikan scopes sudah benar:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
2. Klik **Save and Continue**

#### Test Users (untuk Development)

1. Tambahkan email test Anda
2. Klik **Save and Continue**

### 2. Verify Domain (Opsional, untuk Branding Lebih Baik)

Untuk branding yang lebih profesional, Anda bisa verify domain di Google Search Console:

1. Buka [Google Search Console](https://search.google.com/search-console)
2. Add property: `qrkan.com`
3. Verify ownership (via DNS atau HTML file)
4. Setelah verified, domain akan muncul sebagai verified di OAuth consent screen

### 3. Update Authorized Domains

Pastikan di **OAuth consent screen** → **Authorized domains**, sudah ada:
- `qrkan.com`
- `www.qrkan.com`

**Catatan**: Domain harus verified atau setidaknya terdaftar sebagai authorized domain.

### 4. Publish App (untuk Production)

Jika app sudah siap untuk production:

1. Di **OAuth consent screen**, scroll ke bawah
2. Klik **Publish App**
3. Pilih **Make available to everyone** (untuk public app)
4. Klik **Confirm**

**PENTING**: Setelah publish, perubahan branding akan terlihat dalam beberapa menit hingga beberapa jam.

## Hasil yang Diharapkan

Setelah update, halaman Google login akan menampilkan:
```
Sign in
to continue to qrkan.com
```

Atau jika app name sudah di-set dengan benar:
```
Sign in
to continue to QR Kan
```

## Troubleshooting

### Masih Menampilkan Supabase Domain

**Penyebab**: Authorized domains belum di-set atau domain belum verified.

**Solusi**:
1. Pastikan `qrkan.com` sudah ditambahkan di **Authorized domains**
2. Verify domain di Google Search Console (opsional tapi recommended)
3. Tunggu beberapa menit hingga perubahan terpropagasi

### "App name" Tidak Muncul

**Penyebab**: App belum di-publish atau masih dalam mode testing.

**Solusi**:
1. Pastikan app sudah di-publish di OAuth consent screen
2. Jika masih testing, pastikan user sudah ditambahkan sebagai test user

### Branding Tidak Berubah Setelah Update

**Penyebab**: Cache atau perubahan belum terpropagasi.

**Solusi**:
1. Clear browser cache
2. Tunggu 5-15 menit untuk perubahan terpropagasi
3. Coba login lagi dengan incognito/private window

## Catatan Penting

1. **Authorized domains** adalah kunci untuk branding - pastikan `qrkan.com` sudah ditambahkan
2. Google akan menampilkan domain dari **Authorized domains** yang terverifikasi
3. Jika domain tidak verified, Google mungkin masih menampilkan Supabase domain sebagai fallback
4. Untuk branding terbaik, verify domain di Google Search Console

---

**Setelah update, branding OAuth login akan menampilkan qrkan.com!** 🎉

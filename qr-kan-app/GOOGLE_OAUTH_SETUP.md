# Setup Google OAuth Login

Panduan lengkap untuk mengonfigurasi Google OAuth authentication di project QR Kan.

## 1. Setup Google OAuth di Google Cloud Console

### Langkah 1: Buat Project di Google Cloud Console

1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Isi nama project (contoh: "QR Kan OAuth")
4. Klik **Create**

### Langkah 2: Enable Google+ API

1. Di Google Cloud Console, buka **APIs & Services** → **Library**
2. Cari "Google+ API" atau "Google Identity"
3. Klik **Enable**

### Langkah 3: Setup OAuth Consent Screen (PENTING untuk Branding)

1. Buka **APIs & Services** → **OAuth consent screen**
2. **User Type**: Pilih **External** (untuk public) atau **Internal** (untuk G Suite)
3. Klik **Create**
4. Isi form **App information**:
   - **App name**: `QR Kan` (atau nama yang ingin ditampilkan)
   - **User support email**: Email Anda
   - **App logo**: Upload logo QR Kan (opsional, 120x120px)
   - **Application home page**: `https://qrkan.com`
   - **Application privacy policy link**: `https://qrkan.com/privacy` (opsional)
   - **Application terms of service link**: `https://qrkan.com/terms` (opsional)
   - **Authorized domains**: Tambahkan:
     - `qrkan.com`
     - `www.qrkan.com`
   - **Developer contact information**: Email Anda
5. Klik **Save and Continue**
6. **Scopes**: 
   - Klik **Add or Remove Scopes**
   - Centang:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Klik **Update** → **Save and Continue**
7. **Test users** (untuk development):
   - Klik **Add Users**
   - Tambahkan email test Anda
   - Klik **Add** → **Save and Continue**

**PENTING**: Authorized domains harus diisi dengan domain Anda (`qrkan.com`) agar branding muncul dengan benar!

### Langkah 4: Buat OAuth 2.0 Credentials

1. Buka **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**

3. **Application type**: Web application
4. **Name**: QR Kan Web Client
5. **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://qrkan.com` dan `https://www.qrkan.com`
6. **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://qrkan.com/api/auth/callback` dan `https://www.qrkan.com/api/auth/callback`
   - **PENTING**: Juga tambahkan Supabase callback URL:
     - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
7. Klik **Create**
8. **Copy Client ID dan Client Secret** (simpan dengan aman!)

## 2. Setup Google OAuth di Supabase

### Langkah 1: Buka Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda

### Langkah 2: Konfigurasi Google Provider

1. Buka **Authentication** → **Providers**
2. Scroll ke **Google** dan klik untuk expand
3. **Enable Google provider**: ON
4. Masukkan credentials dari Google Cloud Console:
   - **Client ID (for OAuth)**: Paste Client ID dari Google Cloud Console
   - **Client Secret (for OAuth)**: Paste Client Secret dari Google Cloud Console
5. Klik **Save**

### Langkah 3: Konfigurasi Redirect URLs

1. Buka **Authentication** → **URL Configuration**
2. **Site URL**: 
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. **Redirect URLs**: Tambahkan:
   - `http://localhost:3000/api/auth/callback`
   - `https://yourdomain.com/api/auth/callback`
4. Klik **Save**

## 3. Test Google OAuth

### Development

1. Pastikan development server berjalan:
   ```bash
   npm run dev
   ```

2. Buka browser dan kunjungi:
   - `http://localhost:3000/login`
   - Klik tombol **"Masuk dengan Google"**
   - Pilih akun Google
   - Setelah login, akan redirect ke dashboard

### Production

1. Pastikan semua URL sudah dikonfigurasi dengan benar:
   - Google Cloud Console: Authorized redirect URIs
   - Supabase: Redirect URLs
   - Environment variables di Vercel

2. Test di production URL

## 4. Troubleshooting

### Error: "redirect_uri_mismatch"

**Penyebab**: Redirect URI tidak cocok dengan yang terdaftar di Google Cloud Console.

**Solusi**:
1. Pastikan redirect URI di Google Cloud Console sama persis dengan:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://yourdomain.com/api/auth/callback`
2. Juga pastikan Supabase callback URL sudah ditambahkan:
   - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

### Error: "invalid_client"

**Penyebab**: Client ID atau Client Secret salah.

**Solusi**:
1. Cek kembali Client ID dan Client Secret di Supabase
2. Pastikan tidak ada spasi atau karakter tambahan
3. Regenerate credentials di Google Cloud Console jika perlu

### Error: "access_denied"

**Penyebab**: User menolak permission atau OAuth consent screen belum dikonfigurasi.

**Solusi**:
1. Pastikan OAuth consent screen sudah dikonfigurasi di Google Cloud Console
2. Untuk development, pastikan test user sudah ditambahkan
3. Untuk production, pastikan app sudah di-verify (jika diperlukan)

### User tidak ter-redirect setelah login

**Penyebab**: Callback route tidak bekerja atau redirect URL salah.

**Solusi**:
1. Cek console browser untuk error
2. Pastikan route `/api/auth/callback` bisa diakses
3. Cek network tab untuk melihat response dari callback

### Profile tidak otomatis dibuat

**Penyebab**: Error saat create profile atau database connection issue.

**Solusi**:
1. Cek server logs untuk error
2. Pastikan `POSTGRES_URL` sudah dikonfigurasi dengan benar
3. User bisa membuat profile manual di dashboard

## 5. Fitur yang Tersedia

✅ **Login dengan Google** - User bisa login menggunakan akun Google  
✅ **Signup dengan Google** - User baru bisa daftar langsung dengan Google  
✅ **Auto Profile Creation** - Profile otomatis dibuat setelah OAuth login  
✅ **Auto Username Generation** - Username otomatis dibuat dari email atau Google name  
✅ **Avatar Sync** - Avatar dari Google otomatis di-sync ke profile  

## 6. Security Best Practices

1. **Jangan commit credentials** - Client ID dan Secret jangan di-commit ke git
2. **Gunakan environment variables** - Simpan credentials di `.env.local` atau Vercel
3. **Limit redirect URLs** - Hanya tambahkan URL yang benar-benar digunakan
4. **Monitor OAuth usage** - Cek Google Cloud Console untuk aktivitas mencurigakan
5. **Keep secrets updated** - Regenerate credentials secara berkala

## 7. Production Checklist

Sebelum deploy ke production:

- [ ] OAuth consent screen sudah dikonfigurasi
- [ ] Production redirect URLs sudah ditambahkan di Google Cloud Console
- [ ] Production redirect URLs sudah ditambahkan di Supabase
- [ ] Environment variables sudah dikonfigurasi di Vercel
- [ ] Site URL sudah diupdate di Supabase
- [ ] Test login/signup dengan Google di production
- [ ] Monitor error logs setelah deploy

---

**Selesai!** 🎉 Google OAuth login sudah siap digunakan.

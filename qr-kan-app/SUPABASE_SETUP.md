# Setup Supabase Authentication

Panduan lengkap untuk mengonfigurasi Supabase authentication di project QR Kan.

## 1. Buat Project di Supabase

1. Kunjungi [https://supabase.com](https://supabase.com)
2. Sign up atau login dengan akun Anda
3. Klik "New Project"
4. Isi detail project:
   - **Name**: QR Kan (atau nama lain)
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih region terdekat (Singapore untuk Indonesia)
5. Tunggu hingga project selesai dibuat (~2 menit)

## 2. Dapatkan API Keys

Setelah project dibuat:

1. Buka project Anda
2. Klik **Settings** (ikon gear) di sidebar kiri
3. Klik **API** di sidebar settings
4. Copy credentials berikut:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon public key** (dimulai dengan `eyJ...`)

## 3. Setup Environment Variables

1. Buat file `.env.local` di root project (`qr-kan-app/`)
2. Tambahkan credentials Supabase:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database
DATABASE_URL=file:./var/db.sqlite
```

**PENTING**: Ganti `your-project-url` dan `your-anon-key-here` dengan credentials Anda!

## 4. Konfigurasi Authentication (Opsional)

### Email Confirmation

Secara default, Supabase mengharuskan email confirmation. Untuk development, Anda bisa menonaktifkannya:

1. Buka project Supabase
2. Klik **Authentication** > **Settings**
3. Scroll ke **Email Auth**
4. **Nonaktifkan "Confirm email"** untuk development
5. Klik **Save**

### Allowed URLs (untuk Production)

Tambahkan URL production Anda:

1. **Authentication** > **URL Configuration**
2. Tambahkan URL ke **Site URL** dan **Redirect URLs**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.vercel.app`

## 5. Test Authentication

1. Jalankan development server:
```bash
npm run dev
```

2. Buka browser dan kunjungi:
   - `http://localhost:3000/register` - Daftar akun baru
   - `http://localhost:3000/login` - Login

3. Setelah register, cek:
   - Dashboard di `http://localhost:3000/dashboard`
   - Profile publik di `http://localhost:3000/@username`

## 6. Verifikasi di Supabase Dashboard

Cek apakah user berhasil terdaftar:

1. Buka Supabase project
2. Klik **Authentication** > **Users**
3. Anda akan melihat user yang baru terdaftar

## Troubleshooting

### Error: "Invalid API key"
- Pastikan environment variables sudah benar
- Restart development server setelah menambah `.env.local`

### Email not sent
- Untuk development, nonaktifkan email confirmation
- Untuk production, setup SMTP di **Authentication** > **Email Templates**

### Redirect tidak work
- Pastikan URL sudah ditambahkan di **Redirect URLs**
- Clear browser cache

## Fitur yang Tersedia

✅ **Register** - Pendaftaran dengan email & password  
✅ **Login** - Masuk dengan email & password  
✅ **Logout** - Keluar dari akun  
✅ **Protected Routes** - Dashboard otomatis ter-protect  
✅ **Auto Profile Creation** - Profile otomatis dibuat saat register  
✅ **Session Management** - Middleware handle session refresh  

## Deploy ke Production

Saat deploy ke Vercel:

1. Tambahkan environment variables di Vercel:
   - **Settings** > **Environment Variables**
   - Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Update Supabase redirect URLs dengan domain production

3. Deploy!

---

**Selesai!** 🎉 Sistem authentication Anda sudah siap digunakan.







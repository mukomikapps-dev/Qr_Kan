# Panduan Deploy ke Vercel

## Prerequisites

1. **Akun Vercel** - Daftar di [vercel.com](https://vercel.com)
2. **Vercel CLI** - Sudah terinstall (`vercel --version`)
3. **GitHub Repository** - Code sudah di-push ke GitHub
4. **Environment Variables** - Siapkan semua env vars yang diperlukan

## Langkah-langkah Deploy

### 1. Login ke Vercel

```bash
cd qr-kan-app
vercel login
```

Pilih metode login (GitHub, Email, dll) dan ikuti instruksi.

### 2. Link Project ke Vercel (Pertama Kali)

```bash
vercel link
```

Pilih:
- **Set up and deploy?** → Yes
- **Which scope?** → Pilih akun/organisasi Anda
- **Link to existing project?** → No (untuk project baru) atau Yes (jika sudah ada)
- **Project name?** → qr-kan-app (atau nama lain)
- **Directory?** → `./` (current directory)

### 3. Setup Environment Variables

**PENTING**: Sebelum deploy production, pastikan semua environment variables sudah di-set di Vercel.

#### Via Vercel Dashboard (Recommended):

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project **qr-kan-app**
3. Klik **Settings** → **Environment Variables**
4. Tambahkan variabel berikut:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
POSTGRES_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
MOOTA_API_KEY=your_moota_api_token (optional)
MOOTA_API_BASE=https://app.moota.co/api/v1 (optional)
```

**Environment**: Pilih **Production**, **Preview**, dan **Development**

#### Via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add POSTGRES_URL production
vercel env add POSTGRES_URL_NON_POOLING production
# ... dan seterusnya
```

### 4. Deploy ke Production

```bash
vercel --prod
```

Atau deploy preview terlebih dahulu:

```bash
vercel
```

### 5. Verifikasi Deploy

Setelah deploy selesai, Vercel akan memberikan URL:
- **Production**: `https://qr-kan-app.vercel.app` (atau custom domain)
- **Preview**: `https://qr-kan-app-[hash].vercel.app`

## Setup Custom Domain (qrkan.com)

### 1. Di Vercel Dashboard

1. Buka project → **Settings** → **Domains**
2. Klik **Add Domain**
3. Masukkan: `qrkan.com` dan `www.qrkan.com`
4. Ikuti instruksi untuk setup DNS

### 2. Update Supabase Redirect URLs

Setelah domain aktif, update di Supabase:
1. **Authentication** → **URL Configuration**
2. **Site URL**: `https://qrkan.com`
3. **Redirect URLs**: Tambahkan `https://qrkan.com/api/auth/callback`

### 3. Update Google Cloud Console

Tambahkan redirect URI di Google Cloud Console:
- `https://qrkan.com/api/auth/callback`

## Troubleshooting

### Build Error

```bash
# Cek build log di Vercel Dashboard
# Atau build lokal untuk debug
npm run build
```

### Environment Variables Missing

- Pastikan semua env vars sudah di-set di Vercel
- Pastikan environment (Production/Preview) sudah benar
- Redeploy setelah menambah env vars

### Database Connection Error

- Pastikan `POSTGRES_URL` sudah benar
- Pastikan IP Vercel sudah di-whitelist di Supabase (jika menggunakan IP restriction)
- Cek Supabase Dashboard → Settings → Database → Connection Pooling

### OAuth Not Working

- Pastikan redirect URLs sudah ditambahkan di:
  - Google Cloud Console
  - Supabase URL Configuration
- Pastikan domain production sudah di-set di semua tempat

## Auto Deploy dari GitHub

Setelah pertama kali deploy, Vercel akan otomatis deploy setiap ada push ke branch `main`:

1. Push code ke GitHub
2. Vercel otomatis detect changes
3. Build dan deploy otomatis

## Manual Deploy Command

```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# Deploy dengan environment tertentu
vercel --prod --env NEXT_PUBLIC_SUPABASE_URL=value
```

## Checklist Sebelum Deploy

- [ ] Build lokal berhasil (`npm run build`)
- [ ] Semua environment variables sudah di-set di Vercel
- [ ] Google OAuth redirect URIs sudah dikonfigurasi
- [ ] Supabase redirect URLs sudah diupdate
- [ ] Database connection sudah di-test
- [ ] Custom domain sudah di-setup (jika menggunakan)

---

**Selamat deploy! 🚀**

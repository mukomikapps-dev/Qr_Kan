# QR Kan App

Aplikasi web untuk membuat dan mengelola profil digital dengan QR Code. Dibangun dengan Next.js, Supabase, dan Drizzle ORM.

## 📋 Daftar Isi

- [Persyaratan](#persyaratan)
- [Cara Clone & Setup](#cara-clone--setup)
- [Installasi](#installasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Database](#setup-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Build untuk Production](#build-untuk-production)
- [Deploy](#deploy)
- [Struktur Project](#struktur-project)
- [Scripts yang Tersedia](#scripts-yang-tersedia)
- [Troubleshooting](#troubleshooting)

## 🔧 Persyaratan

Sebelum memulai, pastikan Anda sudah menginstall:

- **Node.js** (versi 18 atau lebih baru)
- **npm** atau **yarn** atau **pnpm**
- **Git**
- **Akun Supabase** (untuk authentication dan database)
- **Akun Moota** (opsional, untuk fitur subscription)

## 📥 Cara Clone & Setup

### 1. Clone Repository

```bash
# Clone repository
git clone https://github.com/mukomikapps-dev/Qr_Kan.git

# Masuk ke folder project
cd Qr_Kan/qr-kan-app
```

### 2. Install Dependencies

```bash
# Install semua dependencies
npm install

# atau menggunakan yarn
yarn install

# atau menggunakan pnpm
pnpm install
```

## ⚙️ Konfigurasi Environment

### 1. Buat File Environment

Buat file `.env.local` di folder `qr-kan-app/`:

```bash
cd qr-kan-app
touch .env.local
```

### 2. Setup Supabase

Ikuti panduan lengkap di [SUPABASE_SETUP.md](./qr-kan-app/SUPABASE_SETUP.md) untuk:
- Membuat project Supabase
- Mendapatkan API keys
- Konfigurasi authentication

### 3. Isi Environment Variables

Tambahkan variabel berikut ke `.env.local`:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database (Required)
POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Service Role (Optional, untuk admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Moota API (Optional, untuk subscription)
MOOTA_API_KEY=your_moota_api_token
MOOTA_API_BASE=https://app.moota.co/api/v1
MOOTA_ACCOUNT_NUMBER=your_bank_account_number
MOOTA_WEBHOOK_SECRET=your_webhook_secret
```

**Cara mendapatkan credentials:**

1. **Supabase URL & Keys:**
   - Buka project di [Supabase Dashboard](https://app.supabase.com)
   - Settings → API
   - Copy `Project URL` dan `anon public key`

2. **PostgreSQL URL:**
   - Settings → Database
   - Copy `Connection string` (gunakan `URI` format)
   - Ganti `[YOUR-PASSWORD]` dengan database password Anda

3. **Moota API:**
   - Ikuti panduan di [migrations/SUBSCRIPTION-SETUP.md](./qr-kan-app/migrations/SUBSCRIPTION-SETUP.md)

## 🗄️ Setup Database

### 1. Jalankan Migration Database

Project menggunakan Drizzle ORM untuk mengelola database schema. Migration files ada di folder `drizzle/`.

**Opsi A: Menggunakan Supabase SQL Editor (Recommended)**

1. Buka Supabase Dashboard → SQL Editor
2. Buka file migration di `qr-kan-app/drizzle/` (mulai dari `0000_*.sql`)
3. Copy-paste isi file ke SQL Editor
4. Run query

**Opsi B: Menggunakan Drizzle Kit**

```bash
# Generate migration (jika ada perubahan schema)
npm run db:generate

# Push schema ke database
npm run db:push
```

### 2. Setup Schema Awal

Jika menggunakan Supabase, jalankan file `supabase-schema.sql`:

1. Buka Supabase Dashboard → SQL Editor
2. Buka file `qr-kan-app/supabase-schema.sql`
3. Copy-paste dan run

### 3. Seed Database (Opsional)

```bash
npm run seed
```

## 🚀 Menjalankan Aplikasi

### Development Mode

```bash
# Jalankan development server
npm run dev

# Aplikasi akan berjalan di http://localhost:3000
```

Buka browser dan akses:
- **Homepage**: http://localhost:3000
- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Explore**: http://localhost:3000/explore

### Production Mode

```bash
# Build aplikasi
npm run build

# Jalankan production server
npm start
```

## 📦 Build untuk Production

```bash
# Build aplikasi
npm run build

# Build akan menghasilkan folder .next/ dengan optimized files
```

## 🌐 Deploy

### Deploy ke Vercel (Recommended)

1. **Push code ke GitHub** (sudah dilakukan)

2. **Import project ke Vercel:**
   - Buka [Vercel Dashboard](https://vercel.com/dashboard)
   - Klik "Add New" → "Project"
   - Import repository `Qr_Kan`
   - Pilih folder `qr-kan-app` sebagai root directory

3. **Setup Environment Variables di Vercel:**
   - Settings → Environment Variables
   - Tambahkan semua variabel dari `.env.local`
   - Pastikan untuk Production, Preview, dan Development

4. **Deploy:**
   - Klik "Deploy"
   - Tunggu hingga build selesai

### Environment Variables di Vercel

Tambahkan variabel berikut di Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
POSTGRES_URL
POSTGRES_URL_NON_POOLING
SUPABASE_SERVICE_ROLE_KEY (optional)
MOOTA_API_KEY (optional)
MOOTA_API_BASE (optional)
MOOTA_ACCOUNT_NUMBER (optional)
MOOTA_WEBHOOK_SECRET (optional)
```

## 📁 Struktur Project

```
Qr_Kan/
├── qr-kan-app/              # Main application folder
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── db/              # Database schema & client
│   │   └── lib/             # Utility functions
│   ├── public/              # Static assets
│   ├── drizzle/             # Database migrations
│   ├── migrations/          # SQL migration files
│   ├── scripts/             # Utility scripts
│   ├── .env.local          # Environment variables (not in git)
│   ├── package.json        # Dependencies
│   └── next.config.ts      # Next.js configuration
└── README.md               # This file
```

## 🛠️ Scripts yang Tersedia

```bash
# Development
npm run dev          # Jalankan development server

# Build & Production
npm run build        # Build untuk production
npm start           # Jalankan production server

# Database
npm run db:generate # Generate migration files
npm run db:push     # Push schema ke database
npm run seed        # Seed database dengan data dummy

# Linting
npm run lint        # Run ESLint
```

### Utility Scripts

Scripts di folder `scripts/` untuk operasi khusus:

```bash
# Create user
node scripts/create-user.mjs

# Create super admin
node scripts/create-super-admin.mjs

# Run migrations
node scripts/run-migration.mjs
node scripts/run-category-migration.mjs
node scripts/run-status-migration.mjs
```

## 🔐 Keamanan

**PENTING:** Jangan commit file berikut ke repository:

- `.env.local` - Environment variables
- `.env` - Environment variables
- `var/` - Local database files
- `node_modules/` - Dependencies
- `.next/` - Build files

File-file ini sudah di-ignore oleh `.gitignore`.

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah benar
- Restart development server setelah mengubah `.env.local`

### Error: "Database connection failed"
- Pastikan `POSTGRES_URL` sudah benar
- Cek apakah database password sudah benar
- Pastikan IP address sudah di-whitelist di Supabase (Settings → Database → Connection Pooling)

### Error: "Module not found"
- Hapus `node_modules/` dan `package-lock.json`
- Jalankan `npm install` lagi

### Build error di Vercel
- Pastikan semua environment variables sudah ditambahkan di Vercel
- Cek build logs di Vercel dashboard untuk detail error
- Pastikan Node.js version sesuai (18+)

### Email confirmation tidak bekerja
- Untuk development, nonaktifkan email confirmation di Supabase:
  - Authentication → Settings → Email Auth
  - Nonaktifkan "Confirm email"

## 📚 Dokumentasi Tambahan

- [Supabase Setup Guide](./qr-kan-app/SUPABASE_SETUP.md)
- [Subscription Setup](./qr-kan-app/migrations/SUBSCRIPTION-SETUP.md)
- [Admin Setup](./qr-kan-app/ADMIN_SETUP.md)
- [Moota Environment Setup](./qr-kan-app/migrations/MOOTA-ENV-SETUP.md)

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

Private project - All rights reserved

## 👥 Authors

- **mukomikapps-dev** - Initial work

## 🙏 Acknowledgments

- Next.js team
- Supabase team
- Drizzle ORM team
- Moota team

---

**Selamat coding! 🚀**

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.


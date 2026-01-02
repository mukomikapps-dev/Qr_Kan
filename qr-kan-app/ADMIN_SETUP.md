# Admin Panel Setup Guide

Panduan lengkap untuk setup dan menggunakan Admin Panel QR Kan.

## 🔐 Keamanan

Admin Panel dilengkapi dengan keamanan ketat:

- ✅ **Super Admin Only**: Hanya user dengan `is_super_admin = TRUE` yang dapat akses
- ✅ **Rate Limiting**: Maksimal 5 percobaan login gagal, kemudian akun terkunci 15 menit
- ✅ **IP Tracking**: Setiap percobaan login dicatat berdasarkan IP
- ✅ **Session Management**: Menggunakan Supabase Auth untuk session management
- ✅ **Middleware Protection**: Semua route `/admin/*` dilindungi oleh middleware

## 📋 Setup

### 1. Jalankan Migration

Jalankan migration SQL untuk menambahkan kolom `is_super_admin`:

```sql
-- File: migrations/add-super-admin.sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin) WHERE is_super_admin = TRUE;
```

Atau jalankan via script:

```bash
node scripts/run-migration.mjs migrations/add-super-admin.sql
```

### 2. Set User sebagai Super Admin

Gunakan script untuk set user sebagai super admin:

```bash
node scripts/set-super-admin.mjs <email>
```

Contoh:
```bash
node scripts/set-super-admin.mjs admin@example.com
```

Atau langsung via SQL:

```sql
UPDATE users 
SET is_super_admin = TRUE 
WHERE email = 'admin@example.com';
```

### 3. Login ke Admin Panel

1. Buka `/admin/login`
2. Masukkan email dan password user yang sudah di-set sebagai super admin
3. Setelah login berhasil, akan di-redirect ke `/admin`

## 🎯 Fitur Admin Panel

### Overview Tab
- Platform Statistics
  - Total Users
  - Total Profiles
  - Total Blocks
  - Total Visits
  - Total Clicks
  - Pro Users
  - Free Users
  - Admin Users

### Users Tab
- User Management
  - Search users
  - View user details
  - See user status (Admin/Pro/Free)
  - View creation date
  - Edit/Delete actions (coming soon)

### Settings Tab
- Platform Settings (coming soon)

## 🔒 Security Features

### Rate Limiting
- Maksimal 5 percobaan login gagal per 15 menit
- Lock berdasarkan email atau IP
- Auto-unlock setelah 15 menit

### Access Control
- Middleware check untuk semua `/admin/*` routes
- Server-side verification di setiap page
- API endpoint verification untuk admin actions

### Session Management
- Menggunakan Supabase Auth
- Secure cookies
- Auto-logout jika session expired

## 📁 File Structure

```
src/app/admin/
├── login/
│   └── page.tsx          # Admin login page
├── page.tsx              # Admin dashboard (server)
└── AdminDashboardClient.tsx  # Admin dashboard (client)

src/lib/
└── admin-auth.ts         # Admin authentication helpers

src/app/api/admin/
├── verify/
│   └── route.ts         # Verify admin status
└── rate-limit/
    └── route.ts         # Rate limiting for login

middleware.ts             # Route protection
```

## 🚨 Troubleshooting

### "Access Denied" Error
- Pastikan user sudah di-set sebagai super admin
- Cek database: `SELECT * FROM users WHERE email = 'your-email'`
- Pastikan `is_super_admin = TRUE`

### Rate Limit Error
- Tunggu 15 menit setelah 5 percobaan gagal
- Atau reset rate limit di database (jika menggunakan persistent storage)

### Login Tidak Berfungsi
- Pastikan Supabase Auth sudah dikonfigurasi dengan benar
- Cek environment variables: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Pastikan user sudah terdaftar di Supabase Auth

## 📝 Notes

- Admin Panel hanya bisa diakses oleh super admin
- Semua admin actions dicatat (logging bisa ditambahkan)
- Rate limiting menggunakan in-memory storage (untuk production, gunakan Redis)
- CSRF protection bisa ditambahkan untuk form submissions

## 🔄 Next Steps

Fitur yang bisa ditambahkan:
- [ ] User management (edit, delete, ban)
- [ ] Profile management
- [ ] Block management
- [ ] Analytics dashboard
- [ ] System logs
- [ ] Email notifications
- [ ] Two-factor authentication (2FA)
- [ ] Audit logs





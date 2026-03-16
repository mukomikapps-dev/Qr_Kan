# 🔑 Cara Menggunakan Password Reset

## Problem yang Diselesaikan
❌ **Sebelumnya**: User yang lupa password mendapat error 404
✅ **Sekarang**: User bisa reset password dengan mudah melalui email

---

## 🚀 Alur Kerja (User Perspective)

### Step 1: Halaman Login
```
1. User buka https://qrkan.com/login
2. Klik tombol "Lupa password?" (di bawah input password)
```

### Step 2: Form Lupa Password
```
1. Masukkan email akun → https://qrkan.com/auth/forgot-password
2. Klik "Kirim Link Pemulihan"
3. Lihat pesan "Cek email Anda"
```

### Step 3: Email dari Supabase
```
User terima email dengan subject: "Password reset"
Isi email berisi: tombol "Reset password" atau link
```

### Step 4: Halaman Reset Password
```
1. User klik link dari email
2. Otomatis diarahkan ke https://qrkan.com/auth/recover
3. Form muncul untuk buat password baru
```

### Step 5: Buat Password Baru
```
1. Masukkan password baru (minimal 6 karakter)
2. Masukkan lagi untuk konfirmasi
3. Klik "Atur Ulang Password"
4. Lihat pesan "Berhasil!"
5. Otomatis kembali ke login setelah 2 detik
```

### Step 6: Login
```
1. Masukkan email dan password baru
2. Klik "Masuk"
3. Akses dashboard ✅
```

---

## 📁 Struktur File yang Baru

```
src/app/
├── auth/
│   ├── forgot-password/
│   │   └── page.tsx (Form lupa password)
│   └── recover/
│       └── page.tsx (Form reset password + handle token)
├── login/
│   └── LoginForm.tsx (Ditambah link "Lupa password?")
└── api/auth/
    └── reset-password/
        └── route.ts (API endpoint)

middleware.ts (Updated: allow /auth routes)
PASSWORD_RESET_SETUP.md (Dokumentasi lengkap)
```

---

## 🔐 Keamanan

✅ **Yang Dilindungi**:
- Token recovery hanya berlaku 1 jam
- Password minimal 6 karakter
- Tidak ada exposé email user di URL (token di hash)
- Setiap token hanya bisa dipakai 1x

---

## 🆘 Kalau Ada Error

### "Link tidak valid atau telah kadaluarsa"
→ Request link pemulihan baru dari halaman lupa password

### "Email tidak sampai"
→ Cek folder spam / folder promosi
→ Tunggu beberapa menit (server email bisa slow)
→ Request link baru jika perlu

### "Password tidak cocok"
→ Pastikan kedua input password sama dan tidak ada spasi

---

## 📊 Tech Stack

| Komponen | Service |
|----------|---------|
| Authentication | Supabase Auth |
| Password Reset | Supabase `resetPasswordForEmail()` |
| Token Exchange | Supabase SSR Client |
| Email | Supabase SMTP (configured) |
| Redirect | Next.js App Router |

---

## ⚙️ Config yang Diperlukan (Admin)

### 1. Di Supabase Dashboard
```
Settings → Email
- Enable SMTP atau gunakan Supabase Default Email Service
```

### 2. Di Supabase Dashboard
```
Authentication → URL Configuration
- Add: https://qrkan.com (atau domain production)
```

### 3. Di .env.local (Server)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://qrkan.com (opsional)
```

---

## ✨ Fitur Bonus

- ✅ Responsive design (mobile & desktop)
- ✅ Loading states
- ✅ Error handling
- ✅ Success feedback
- ✅ Redirects otomatis
- ✅ Indonesian translations

---

## 🐛 Debugging

Jika ada masalah:

### Check di browser console (F12)
```javascript
// Test Supabase connection
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(url, key);
supabase.auth.getSession(); // Should return session if logged in
```

### Check di Supabase Dashboard
```
Auth → Users
- Lihat apakah user ada
- Cek last_sign_in_at dan updated_at
```

### Check di logs
```
API route: /src/app/api/auth/reset-password/route.ts
- Buka file dan cek console.error() untuk details
```

---

## 📞 Support

Jika masih ada error 404 atau masalah lain:
1. Pastikan sudah deploy file baru (refresh page di browser)
2. Pastikan middleware.ts ter-update
3. Check apakah environment variables benar
4. Cek Supabase project settings

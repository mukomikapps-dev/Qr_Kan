# Password Reset & Recovery Setup

## ✅ Setup Completed

Password reset functionality telah ditambahkan ke aplikasi QR Kan. Berikut adalah fitur-fitur yang tersedia:

### 1. **Forgot Password Flow** (/auth/forgot-password)
- User memasukkan email mereka
- Aplikasi mengirim request ke `/api/auth/reset-password`
- Supabase mengirim email dengan recovery link
- Email berisi link yang mengarah ke `/auth/recover` dengan token di URL hash

### 2. **Password Recovery Page** (/auth/recover)
- Menangani token recovery dari Supabase
- Token diproses otomatis dari URL hash
- User diminta membuat password baru
- Setelah berhasil, user dialihkan ke halaman login

### 3. **Perubahan di Login Form**
- Ditambahkan link "Lupa password?" di bawah input password
- Link mengarah ke `/auth/forgot-password`

### 4. **Middleware Updates**
- Path `/auth/*` dan `/login` tidak memerlukan autentikasi
- Memungkinkan user tidak terauthentikasi mengakses password reset

---

## 📁 File yang Dibuat/Diubah

### ✨ File Baru:
1. **src/app/auth/recover/page.tsx**
   - Handle recovery token dari Supabase
   - Form untuk reset password
   - Validasi password (minimal 6 karakter)

2. **src/app/auth/forgot-password/page.tsx**
   - Form untuk input email
   - Mengirim request ke API
   - Menampilkan success message

3. **src/app/api/auth/reset-password/route.ts**
   - API endpoint POST untuk forgot password
   - Menggunakan `resetPasswordForEmail` dari Supabase
   - Redirect URL ke `/auth/recover`

### 🔄 File yang Diubah:
1. **middleware.ts**
   - Menambahkan `/auth/*`, `/login`, dan `/register` ke public routes
   - Tidak memerlukan autentikasi untuk halaman ini

2. **src/app/login/LoginForm.tsx**
   - Menambahkan tombol "Lupa password?" 
   - Link ke `/auth/forgot-password`

---

## 🔧 Environment Configuration

Pastikan file `.env.local` memiliki:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://your-app-domain.com  # Optional
```

Jika `NEXT_PUBLIC_APP_URL` tidak disetting, aplikasi akan menggunakan domain dari `NEXT_PUBLIC_SUPABASE_URL`.

---

## 🧪 Testing Cara Kerja

### Scenario 1: User Lupa Password
1. User klik "Lupa password?" di halaman login
2. User masukkan email → Klik "Kirim Link Pemulihan"
3. User menerima email dari Supabase dengan link recovery
4. User klik link → Diarahkan ke `/auth/recover?#type=recovery&...`
5. Form muncul untuk set password baru
6. Setelah sukses → Dialihkan ke login

### Scenario 2: Magic Link / Invitation Link
Jika Supabase mengirim magic link dari fitur lain:
1. Link berisi `type=recovery` atau `type=passwordreset` di hash
2. `/auth/recover` akan menangani token otomatis
3. User set password baru
4. Redirect ke login

---

## ⚠️ Poin Penting

1. **Expired Tokens**: Jika user menunggu terlalu lama untuk klik link (> 1 jam), token akan expired. User perlu request link baru.

2. **Email Configuration**: Pastikan Supabase email templates sudah dikonfigurasi:
   - Authentication → Templates → Password Reset
   - Pastikan link mengarah ke `https://yourdomain.com/auth/recover`

3. **CORS & Redirect URLs**: Di Supabase Dashboard:
   - Auth → URL Configuration
   - Pastikan `https://yourdomain.com` ada di authorized redirect URLs

4. **Password Requirements**:
   - Minimal 6 karakter (sesuai standar Supabase)
   - Bisa ditingkatkan di `src/app/auth/recover/page.tsx`

---

## 🐛 Troubleshooting

### Masalah: Email tidak dikirim
- Check SMTP di Supabase (Settings → Email)
- Pastikan email template sudah set dengan benar
- Cek spam folder

### Masalah: Link recovery menampilkan error
- Pastikan token di URL hash tidak corrupt
- Cek apakah `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar

### Masalah: "Link tidak valid atau telah kadaluarsa"
- Token Supabase biasanya berlaku 1 jam
- User harus request link pemulihan yang baru

---

## 📚 API Endpoints

### POST /api/auth/reset-password
Request body:
```json
{
  "email": "user@example.com"
}
```

Response success (200):
```json
{
  "message": "Email pemulihan password telah dikirim"
}
```

Response error (400/500):
```json
{
  "error": "Error message"
}
```

---

## ✨ Future Enhancements

Bisa tambah fitur:
1. Rate limiting untuk prevent abuse
2. Custom email templates
3. Resend button jika user tidak menerima email
4. Two-factor authentication (2FA)
5. Biometric login (fingerprint/face)

# ⚙️ Supabase Email Configuration Guide

## 🎯 Tujuan
Setup email recovery di Supabase agar recovery link dari password reset berfungsi dengan baik.

---

## 📝 Step-by-Step Configuration

### Step 1: Buka Supabase Dashboard
1. Login ke [supabase.com](https://supabase.com)
2. Pilih project QR Kan
3. Klik **Settings** (ikon gear) di sidebar kiri

### Step 2: Configure Email Settings
1. Di sidebar Settings, klik **Email**
2. Pilih email provider:
   - **Option A**: Gunakan Supabase Default Email Service (Recommended untuk dev)
   - **Option B**: Setup SMTP sendiri (Gmail, SendGrid, etc.)

#### 🟢 Option A: Supabase Default Email
```
1. Settings → Email
2. Provider: Supabase (Default)
3. Tombol "Enable" jika belum enabled
4. Ready to use! (Sudah configured)
```

#### 🔵 Option B: Custom SMTP (Gmail Example)
```
1. Settings → Email
2. Provider: Custom SMTP
3. Host: smtp.gmail.com
4. Port: 587
5. Username: your-email@gmail.com
6. Password: app-specific-password (bukan password Gmail biasa)
   - Buat app password di Google Account Security
   - https://myaccount.google.com/apppasswords
7. Sender Email: noreply@yourdomain.com
8. Enable TLS/SSL
```

### Step 3: Configure Email Templates
1. Settings → Email → Templates
2. Template: **"Password Reset"**
3. Pastikan isi template sudah benar:
   ```
   Hai {{ .Email }},

   Link untuk reset password Anda:
   {{ .ConfirmationURL }}

   Link ini berlaku selama 1 jam.
   ```

   ✅ Penting: `{{ .ConfirmationURL }}` harus ada di template!
   - Ini akan di-replace dengan link actual recovery

4. ✅ Pastikan template ter-enable

### Step 4: Configure Redirect URLs
1. Settings → Auth → URL Configuration
2. Site URL:
   - Production: `https://qrkan.com`
   - Development: `http://localhost:3000`

3. Authorized Redirect URLs:
   ```
   https://qrkan.com/auth/recover
   https://qrkan.com/api/auth/callback
   http://localhost:3000/auth/recover
   http://localhost:3000/api/auth/callback
   ```

4. ✅ Save changes

---

## 🧪 Test Email Configuration

### Cara Test:
1. Buka halaman login: `https://qrkan.com/login`
2. Klik "Lupa password?"
3. Masukkan email test Anda
4. Klik "Kirim Link Pemulihan"

### Kemudian:
1. Cek inbox email Anda (atau spam folder)
2. Seharusnya terima email dari Supabase dalam 1-5 menit
3. Email akan berisi link ke `/auth/recover`
4. Klik link → Form reset password muncul
5. Atur password baru → Submit
6. Seharusnya sukses dan di-redirect ke login

### Jika Email Tidak Sampai:
```
Checklist:
❌ Cek spam/promotions folder
❌ Tunggu 5-10 menit (server email bisa slow)
❌ Cek email address benar (tidak typo)
❌ Check Supabase email template sudah enabled
❌ Check Supabase SMTP settings benar
❌ Check rate limiting (tunggu sebelum retry)
```

---

## 📧 Email Template Customization

Jika ingin customize template (add logo, change text, etc):

### 1. Default Template (Recommended)
Gunakan default Supabase template jika fine.

### 2. Custom Template
Bisa edit di Settings → Email → Templates → Password Reset

Contoh custom template:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Logo -->
    <img src="https://qrkan.com/logo.png" alt="QR Kan" style="width: 150px; margin-bottom: 20px;">
    
    <!-- Content -->
    <h2 style="color: #10b981;">Reset Password</h2>
    <p>Halo {{ .Email }},</p>
    <p>Kami menerima request untuk reset password Anda. Klik tombol di bawah untuk melanjutkan:</p>
    
    <!-- Button -->
    <p style="margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #10b981; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 5px; display: inline-block;
                font-weight: bold;">
        Reset Password
      </a>
    </p>
    
    <p style="color: #666; font-size: 12px;">
      Link ini berlaku selama 1 jam. Jika Anda tidak melakukan request ini, abaikan email ini.
    </p>
    
    <!-- Footer -->
    <p style="border-top: 1px solid #ddd; padding-top: 20px; color: #999; font-size: 12px;">
      © {{ .SiteURL }} - All rights reserved
    </p>
    
  </div>
</body>
</html>
```

### 3. Save Custom Template
1. Paste template di Settings → Email → Templates → Password Reset
2. Klik Save
3. Test kirim email baru

---

## 🔗 Integration dengan Application

Aplikasi sudah dikonfigurasi untuk:

✅ **API Endpoint**
- `POST /api/auth/reset-password`
- Body: `{ email: "user@example.com" }`
- Response: Success message atau error

✅ **Pages**
- `/auth/forgot-password` - Form untuk lupa password
- `/auth/recover` - Recovery page dengan handler token

✅ **Supabase Methods**
```typescript
// Kirim recovery email
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${baseUrl}/auth/recover`
});

// Update password dari recovery token
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

---

## 📱 Testing Scenarios

### Scenario 1: Happy Path
```
1. User: Buka /login
2. User: Klik "Lupa password?"
3. User: Masukkan email
4. User: Klik "Kirim Link Pemulihan"
5. System: Email dikirim (verifikasi di inbox)
6. User: Buka email, klik link
7. User: Set password baru
8. System: Password berhasil diupdate
9. User: Redirect ke login
10. User: Login dengan password baru ✅
```

### Scenario 2: Expired Token
```
1. User: Buka recovery link (tapi tunggu > 1 jam)
2. System: Tampil error "Link tidak valid atau telah kadaluarsa"
3. User: Klik "Kembali ke Login"
4. User: Request link pemulihan baru ✅
```

### Scenario 3: Wrong Password Confirmation
```
1. User: Set password baru
2. User: Konfirmasi password berbeda
3. System: Tampil error "Password tidak cocok"
4. User: Coba lagi dengan password yang sama ✅
```

---

## ⚠️ Debugging

### Check Email Logs
1. Supabase Dashboard
2. Settings → Email
3. Scroll ke "Email Logs"
4. Lihat apakah email terkirim
5. Check status: Sent, Bounced, Failed

### Check Auth Logs
1. Supabase Dashboard
2. Authentication → Users
3. Lihat user Anda
4. Check "last_sign_in_at" dan "updated_at"

### Browser Console
```javascript
// Test Supabase
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
});
const data = await response.json();
console.log(data);
```

---

## 🎛️ Additional Settings (Optional)

### Rate Limiting (Prevent Abuse)
Bisa setup di Supabase Dashboard:
- Settings → Auth → Rate Limiting
- Max 1 request per email per 15 menit (default)

### Email Frequency
- Jika user spam "Kirim Link", Supabase akan rate limit automatically

### Bounce Handling
- Supabase auto-disable email jika bounce rate tinggi
- Check email configuration jika ini terjadi

---

## ✅ Checklist Sebelum Production

- [ ] Supabase email provider configured (Default atau SMTP)
- [ ] Password Reset template enabled
- [ ] Redirect URLs sudah add ke Supabase Auth settings
- [ ] Test password reset flow end-to-end
- [ ] Cek email berhasil dikirim
- [ ] Cek recovery link berfungsi
- [ ] Cek error handling (expired token, invalid password)
- [ ] Semua pages responsive di mobile
- [ ] Indonesian text semua benar
- [ ] Production domain di .env.local

---

## 📞 Support Links

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/email-templates)
- [Email Configuration Guide](https://supabase.com/docs/guides/auth/email-templates)

---

## 🎉 Done!

Setelah complete semua step di atas, password reset sudah siap untuk production!

**Next**: Deploy aplikasi dan test di production domain.

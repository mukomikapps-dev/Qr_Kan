# 🚀 Deployment Checklist - Password Reset Feature

## ✅ Pre-Deployment Checklist

### Code Changes
- [x] `/src/app/auth/recover/page.tsx` - Created
- [x] `/src/app/auth/forgot-password/page.tsx` - Created
- [x] `/src/app/api/auth/reset-password/route.ts` - Created
- [x] `/src/app/login/LoginForm.tsx` - Updated (added forgot password link)
- [x] `/middleware.ts` - Updated (allow /auth routes)

### Documentation
- [x] `PASSWORD_RESET_SETUP.md` - Technical setup
- [x] `QUICK_REFERENCE.md` - User guide
- [x] `SUPABASE_EMAIL_CONFIG.md` - Email configuration
- [x] `SOLUTION_SUMMARY.md` - Overview

### Before Pushing to Git
```bash
# 1. Verify all files exist
ls -la src/app/auth/
ls -la src/app/api/auth/reset-password/
grep -n "Lupa password" src/app/login/LoginForm.tsx
grep -n "pathname.startsWith(\"/auth/\")" middleware.ts

# 2. Check for syntax errors
npm run lint

# 3. Build test
npm run build

# 4. No TypeScript errors
npm run type-check
```

---

## 📋 Deployment Steps

### Step 1: Commit Code
```bash
cd /Users/sugenghariadi/Qr_Kan/qr-kan-app

# Add all changes
git add .

# Commit dengan deskriptif message
git commit -m "feat: add password reset & recovery flow

- Add /auth/recover page untuk handle recovery tokens
- Add /auth/forgot-password page untuk forgot password form
- Add POST /api/auth/reset-password API endpoint
- Update middleware untuk allow /auth/* routes
- Update login form dengan forgot password link
- Add documentation dan setup guides"

# Push ke repository
git push origin main
```

### Step 2: Verify Deployment
Setelah push, jika menggunakan Vercel:
```
1. Check Vercel Dashboard
2. Deployment seharusnya auto-trigger
3. Tunggu build complete (usually 2-5 menit)
4. Check deployment status: ✅ Success
```

### Step 3: Configure Supabase
**⚠️ PENTING: Do this BEFORE testing!**

1. Open [Supabase Dashboard](https://supabase.com)
2. Select QR Kan project
3. Go to **Settings → Auth → URL Configuration**
4. Add these redirect URLs:
   ```
   https://qrkan.com/auth/recover
   https://qrkan.com/api/auth/callback
   ```
   (Replace `qrkan.com` dengan domain production Anda)

### Step 4: Setup Email
**⚠️ PENTING: Ensure email is configured!**

1. Supabase Dashboard → Settings → Email
2. Verify email provider is **Enabled**:
   - Either "Supabase Default" atau
   - Custom SMTP sudah configured
3. Go to **Templates → Password Reset**
4. Verify template is **Enabled**
5. Check template content has `{{ .ConfirmationURL }}`

### Step 5: Test Password Reset Flow

**Test #1: Basic Flow**
```
1. Go to https://qrkan.com/login
2. Click "Lupa password?"
3. Masukkan email test (bisa email Anda sendiri)
4. Click "Kirim Link Pemulihan"
5. Check email inbox → Cari email dari Supabase
6. Klik link di email → Seharusnya buka /auth/recover
7. Form "Atur Ulang Password" muncul
8. Masukkan password baru (min 6 char) + konfirmasi
9. Click "Atur Ulang Password"
10. Seharusnya lihat "Berhasil!" message
11. Auto-redirect ke login
12. Login dengan password baru ✅
```

**Test #2: Error Cases**
```
Test: Klik expired link (tunggu > 1 jam)
Expected: Tampil error "Link tidak valid atau telah kadaluarsa"

Test: Buka /auth/recover tanpa token
Expected: Tampil error "Link pemulihan tidak valid"

Test: Password confirm tidak match
Expected: Tampil error "Password tidak cocok"

Test: Password < 6 char
Expected: Tampil error "Password harus minimal 6 karakter"
```

**Test #3: Login dengan Password Baru**
```
1. Setelah reset berhasil
2. Go to /login
3. Masukkan email dan password baru
4. Click "Masuk"
5. Seharusnya login berhasil ✅
```

---

## 📊 Verification Checklist

### Code Level
- [ ] `src/app/auth/recover/page.tsx` exists & has token handling
- [ ] `src/app/auth/forgot-password/page.tsx` exists & has form
- [ ] `src/app/api/auth/reset-password/route.ts` exists & returns proper response
- [ ] `middleware.ts` includes `pathname.startsWith("/auth/")`
- [ ] `LoginForm.tsx` has "Lupa password?" button

### Functionality Level
- [ ] Forgot password form submits correctly
- [ ] Email dikirim dari Supabase
- [ ] Recovery page loads dengan token dari email link
- [ ] Password reset form bekerja
- [ ] Validation messages muncul
- [ ] Success redirect ke login
- [ ] Login dengan password baru berhasil

### Supabase Level
- [ ] Email provider enabled
- [ ] Password Reset template enabled
- [ ] Redirect URLs configured
- [ ] Email dikirim successfully (check logs)
- [ ] Token processing successful

### UI/UX Level
- [ ] Responsive design (mobile & desktop)
- [ ] Loading states berfungsi
- [ ] Error messages clear
- [ ] Success messages clear
- [ ] Indonesian text semuanya benar

---

## 🆘 Troubleshooting During Deployment

### Issue: Files tidak muncul di production
**Solution:**
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. Check Vercel deployment logs
4. Verify files pushed ke git correctly

### Issue: 404 pada /auth/recover
**Cause:** Middleware masih redirect ke login
**Solution:**
1. Verify middleware.ts has `/auth/*` in public routes
2. Redeploy after middleware change
3. Hard refresh browser

### Issue: Email tidak dikirim
**Cause:** SMTP/email provider tidak configured
**Solution:**
1. Go to Supabase → Settings → Email
2. Check provider is enabled
3. Check SMTP credentials benar (jika custom)
4. Check email template enabled
5. Check email logs untuk error details

### Issue: Token tidak valid
**Cause:** Expired token atau wrong redirect URL
**Solution:**
1. Check Supabase auth URL configuration
2. Ensure `https://qrkan.com/auth/recover` is in authorized URLs
3. Test dengan link yang baru (< 1 jam)

### Issue: CORS Error
**Cause:** API endpoint blocked
**Solution:**
1. Check `/api/auth/reset-password/route.ts` exists
2. Verify API accessible: `https://qrkan.com/api/auth/reset-password`
3. Check browser console untuk exact error

---

## 📝 Post-Deployment

### Documentation
- [ ] Share `QUICK_REFERENCE.md` dengan users
- [ ] Share `SUPABASE_EMAIL_CONFIG.md` dengan admins
- [ ] Update FAQ jika ada masalah umum

### Monitoring
- [ ] Check Supabase email logs daily
- [ ] Check error logs untuk recovery page
- [ ] Monitor password reset API usage

### Analytics
Bisa track:
- Berapa banyak users reset password
- Berapa banyak email error
- Conversion rate (request → completion)

### Updates
- [ ] Dokumentasi di GitHub README
- [ ] Share status ke team
- [ ] Create issue untuk enhancement (2FA, SMS, etc)

---

## 🎉 Success Criteria

Deployment berhasil jika:
✅ User bisa click "Lupa password?" dan submit form
✅ Email dikirim dari Supabase
✅ User bisa klik link di email
✅ Password reset form muncul
✅ User bisa set password baru
✅ User bisa login dengan password baru
✅ Error cases ditangani dengan baik
✅ Tidak ada 404 errors
✅ Tidak ada JavaScript errors di console

---

## 📞 Emergency Contacts

Jika ada issue production:
1. Check Supabase status page
2. Check Vercel deployment logs
3. Rollback jika diperlukan (git revert)
4. Check email provider status

---

## 🎯 Next Steps

**Immediate (before go live):**
- [ ] Complete all checklist items
- [ ] Test full flow 3x
- [ ] Get approval dari tim/client

**Post-launch (first week):**
- [ ] Monitor error logs
- [ ] Get feedback dari users
- [ ] Fix bugs immediately

**Future enhancements:**
- [ ] Rate limiting pada API
- [ ] Two-factor authentication
- [ ] Login history
- [ ] Device management
- [ ] SMS recovery codes

---

**Created**: March 3, 2026
**Status**: Ready for deployment ✅

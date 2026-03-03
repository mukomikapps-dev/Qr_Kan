# 🔧 Supabase Email Template Configuration

## ⚙️ Update Password Reset Email Redirect

### Step 1: Buka Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Select project: **QR Kan**
3. Navigate to **Settings** → **Email Templates**

### Step 2: Update Password Reset Template
1. Click on **Password Reset** template
2. In the email template, update the **Redirect URL**:

**Change from:**
```
https://qrkan.com
```

**Change to:**
```
https://qrkan.com/api/auth/verify
```

### Step 3: Test Configuration
The email link will now look like:
```
https://wcvtlsvlrjfftrkuekay.supabase.co/auth/v1/verify?
  token=40d25e6e13b0ea9c30a2200182e6b5fbe1147c05ae497e11f602c47b&
  type=recovery&
  redirect_to=https://qrkan.com/api/auth/verify
```

### Step 4: Flow Explanation
```
1. User clicks link from email
2. Supabase processes token at /auth/v1/verify
3. Supabase redirects to /api/auth/verify endpoint
4. /api/auth/verify validates token and redirects to /auth/recover
5. /auth/recover shows password reset form
6. User sets new password ✅
```

---

## 📧 Email Template Example

If you want to manually edit the template, here's what to include:

```html
<a href="{{ .ConfirmationURL }}" style="...">
  Reset Password
</a>
```

The system will automatically replace `{{ .ConfirmationURL }}` with the correct URL including token.

---

## ✅ Verification

After updating:
1. Test from dashboard: Request magic link
2. Check email received
3. Click link → Should see password reset form (not 404)
4. Set new password → Success ✅

---

**Important:** Make sure to **SAVE** the template changes in Supabase!

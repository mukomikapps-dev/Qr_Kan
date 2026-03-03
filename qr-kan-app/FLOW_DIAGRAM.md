# 🎯 Password Reset Flow - Visual Diagram

## 📊 Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER STARTS AT LOGIN PAGE                      │
│                        /login                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  See "Lupa password?"  │ ◄─── NEW BUTTON
                    │   link below password  │
                    └──────────────────────┘
                               │
                               ▼
        ┌─────────────────────────────────────────┐
        │   USER CLICKS "LUPA PASSWORD?" BUTTON     │
        └─────────────────────────────────────────┘
                               │
                               ▼
        ┌─────────────────────────────────────────┐
        │  REDIRECT TO FORGOT PASSWORD PAGE         │
        │       /auth/forgot-password               │
        │  (NEW PAGE - was 404 before)              │
        └─────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  USER SEES FORM:                          │
        │  - Email input field                      │
        │  - "Kirim Link Pemulihan" button          │
        │  - Back to login link                     │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  USER ENTERS EMAIL & CLICKS BUTTON        │
        │  POST /api/auth/reset-password (NEW API)  │
        │  Body: { email: "user@example.com" }      │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  SERVER SENDS REQUEST TO SUPABASE         │
        │  supabase.auth.resetPasswordForEmail()    │
        │  Redirect: https://qrkan.com/auth/recover │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  SUPABASE GENERATES RECOVERY TOKEN        │
        │  Sends email with recovery link:          │
        │  https://qrkan.com/auth/recover#...       │
        │  (token in URL hash)                      │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  USER SEES SUCCESS MESSAGE                │
        │  "Cek email Anda - link sudah dikirim"    │
        │  - Can go back to login                   │
        │  - Instructions to check email            │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  USER CHECKS EMAIL INBOX                  │
        │  Receives email from Supabase             │
        │  "Password reset" subject                 │
        │  Contains: link + instructions            │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  USER CLICKS LINK IN EMAIL                │
        │  Link format:                             │
        │  https://qrkan.com/auth/recover?          │
        │    type=recovery&                         │
        │    access_token=...&                      │
        │    refresh_token=...                      │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  BROWSER LOADS /auth/recover PAGE         │
        │  (NEW PAGE - was 404 before)              │
        │  Page processes URL hash automatically    │
        └──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────┐
        │  RECOVERY PAGE VALIDATES TOKEN            │
        │  - Check if token valid                   │
        │  - Check if not expired (1 hour)          │
        │  - Exchange token for session             │
        └──────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ✅ VALID TOKEN        ❌ INVALID/EXPIRED
                    │                     │
                    ▼                     ▼
        ┌──────────────────┐  ┌──────────────────────────┐
        │ SHOW RESET FORM  │  │ SHOW ERROR MESSAGE:       │
        │ - Password input │  │ "Link tidak valid atau    │
        │ - Confirm field  │  │  telah kadaluarsa"        │
        │ - Submit button  │  │ - Button: Kembali ke Login│
        └──────────────────┘  └──────────────────────────┘
                    │                     │
                    ▼                     ▼
        ┌──────────────────┐  ┌──────────────────────────┐
        │ USER SETS NEW    │  │ USER CLICKS "KEMBALI KE  │
        │ PASSWORD:        │  │ LOGIN"                   │
        │ - Min 6 chars    │  │ Redirected to /login     │
        │ - Confirm must   │  └──────────────────────────┘
        │   match original │
        │ - Click submit   │
        └──────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    ✅ VALID         ❌ INVALID
        │                       │
        ▼                       ▼
    ┌─────────┐      ┌──────────────────────────┐
    │ SUBMIT  │      │ SHOW ERROR:              │
    │ PASSWORD│      │ - "Password tidak cocok" │
    │  to API │      │ - "Password < 6 char"    │
    └─────────┘      │ User tries again...      │
        │             └──────────────────────────┘
        ▼
    ┌──────────────────────────────────────┐
    │ SUPABASE UPDATES USER PASSWORD       │
    │ supabase.auth.updateUser({           │
    │   password: newPassword              │
    │ })                                   │
    └──────────────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────────┐
    │ SHOW SUCCESS MESSAGE                 │
    │ "Password berhasil diperbarui!"      │
    │ "Anda akan dialihkan ke login..."    │
    │                                      │
    │ (Auto redirect in 2 seconds)         │
    └──────────────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────────┐
    │ REDIRECT TO /login PAGE              │
    │ (After 2 second delay)               │
    └──────────────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────────┐
    │ USER LOGS IN WITH NEW PASSWORD       │
    │ - Email: (sama)                      │
    │ - Password: (password baru)          │
    │ - Click "Masuk"                      │
    └──────────────────────────────────────┘
        │
        ▼
    ┌──────────────────────────────────────┐
    │ ✅ LOGIN SUCCESSFUL!                 │
    │ Redirected to /dashboard/profile     │
    │ User dapat akses aplikasi kembali    │
    └──────────────────────────────────────┘
```

---

## 🗂️ File Structure Overview

```
src/
├── app/
│   ├── login/
│   │   ├── LoginForm.tsx (UPDATED)
│   │   │   ├── Added "Lupa password?" button
│   │   │   └── onClick → /auth/forgot-password
│   │   └── page.tsx
│   │
│   ├── auth/ (NEW DIRECTORY)
│   │   ├── forgot-password/ (NEW)
│   │   │   └── page.tsx
│   │   │       ├── Form: email input
│   │   │       ├── Button: "Kirim Link Pemulihan"
│   │   │       └── POST → /api/auth/reset-password
│   │   │
│   │   └── recover/ (NEW)
│   │       └── page.tsx
│   │           ├── Validate recovery token
│   │           ├── Show password reset form
│   │           └── Update password on submit
│   │
│   └── api/
│       └── auth/
│           ├── callback/ (existing)
│           ├── logout/ (existing)
│           │
│           └── reset-password/ (NEW)
│               └── route.ts
│                   ├── POST handler
│                   └── Calls supabase.auth.resetPasswordForEmail()
│
└── middleware.ts (UPDATED)
    └── Added /auth/* to public routes (no auth required)
```

---

## 🔄 Data Flow - Request/Response

### 1️⃣ Forgot Password Request
```
Client                          API                          Supabase
  │                            │                               │
  ├─ POST /api/auth/           │                               │
  │  reset-password            │                               │
  │  { email: "..." }          │                               │
  │ ──────────────────────────▶│                               │
  │                            │  resetPasswordForEmail()      │
  │                            │─────────────────────────────▶│
  │                            │                               │
  │                            │  Generates token + sends email│
  │                            │◀─────────────────────────────│
  │  Success response          │                               │
  │◀─────────────────────────────                              │
  │                                                             │
  └─── User receives email with link containing token ────────▶
```

### 2️⃣ Recovery Token Processing
```
Email Link                    Browser              Page         Supabase
  │                             │                   │              │
  │ User clicks link            │                   │              │
  │────────────────────────────▶│                   │              │
  │                             │ Load /auth/recover│              │
  │                             │──────────────────▶│              │
  │                             │                   │ Validate     │
  │                             │                   │ token       │
  │                             │                   │─────────────▶│
  │                             │                   │              │
  │                             │                   │ Session OK?  │
  │                             │                   │◀─────────────│
  │                             │   Show form       │              │
  │                             │◀──────────────────│              │
  │                             │                   │              │
  └─────────── User submits new password ──────────▶│              │
                                │                   │ updateUser() │
                                │                   │─────────────▶│
                                │                   │              │
                                │                   │  OK!         │
                                │                   │◀─────────────│
                                │   Success msg     │              │
                                │◀──────────────────│              │
                                │   Redirect to     │              │
                                │   login           │              │
                                ◀──────────────────┘              │
```

---

## 🎯 Key Entry Points

| Page | Route | What Happens |
|------|-------|-------------|
| Login | `/login` | User clicks "Lupa password?" button |
| Forgot Password | `/auth/forgot-password` | User enters email & requests recovery link |
| Recovery | `/auth/recover` | User receives recovery link, sets new password |
| Dashboard | `/dashboard/profile` | After successful password reset & login |

---

## 🔐 Security Checks

```
┌─ Token Validation
│  ├─ Check if token exists
│  ├─ Check if not expired (1 hour)
│  └─ Check if can create session

├─ Password Validation
│  ├─ Check if >= 6 characters
│  ├─ Check if passwords match
│  └─ Check if not empty

├─ Session Validation
│  ├─ Check if user authenticated
│  ├─ Check if recovery token in hash
│  └─ Check if can updateUser()

└─ Rate Limiting (Optional)
   ├─ Max N requests per email per M minutes
   └─ Prevents password reset abuse
```

---

## 📈 Status Codes & Responses

### API: /api/auth/reset-password

#### ✅ Success (200)
```json
{
  "message": "Email pemulihan password telah dikirim"
}
```

#### ❌ Errors
```
400 - Email diperlukan
400 - User tidak ditemukan (from Supabase)
500 - Terjadi kesalahan server
```

### Page: /auth/recover

#### ✅ States
- `loading` - Processing recovery token
- `reset_password` - Show password reset form
- `success` - Password successfully changed
- `error` - Invalid/expired token or error

---

## 🧪 Testing Matrix

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Valid forgot password | email@example.com | Success message |
| Invalid email | not-an-email | Email validation error |
| Nonexistent email | nonexistent@test.com | Email sent (no verification) |
| Valid recovery link | link < 1 hour | Reset form appears |
| Expired recovery link | link > 1 hour | Error message |
| Password mismatch | pwd: "123456", confirm: "654321" | Error message |
| Password too short | "12345" | Error (min 6 chars) |
| Valid reset | pwd: "newpass123", confirm: "newpass123" | Success, redirect to login |

---

**Last Updated**: March 3, 2026
**Feature**: Password Reset & Recovery
**Status**: ✅ Complete & Ready for Deployment

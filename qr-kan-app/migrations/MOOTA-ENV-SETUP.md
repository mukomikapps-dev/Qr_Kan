# Setup Moota Environment Variables di Vercel

Token API Moota sudah berhasil dibuat! Sekarang perlu ditambahkan ke Vercel Environment Variables.

## Token API yang Dibuat
✅ **Nama Token**: QR Kan Subscription  
✅ **Scope**: API (semua akses)  
✅ **Token**: (sudah disalin)

## Langkah-langkah Menambahkan ke Vercel

### 1. Buka Vercel Dashboard
1. Kunjungi https://vercel.com/dashboard
2. Login dengan akun Vercel Anda
3. Pilih project **qr-kan-app** (atau nama project yang sesuai)

### 2. Tambahkan Environment Variables
1. Klik tab **Settings** (ikon gear)
2. Scroll ke bagian **Environment Variables** di sidebar kiri
3. Klik **Environment Variables**

### 3. Tambahkan 3 Environment Variables

#### a. MOOTA_API_KEY
- **Key**: `MOOTA_API_KEY`
- **Value**: 
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJucWllNHN3OGxsdyIsImp0aSI6ImVhZDk5OGNjOGIyMWQwNDk5MTE1ZGFiNzc2MjM1ZTQ2OTMyZDEwYzg3NDIwZjJiMTRhZDJiNzJlODNhNWZiMTBiNDQ5ODgyMTFlNzhiNGQ3IiwiaWF0IjoxNzY3MTg0MjM6Ljk3OTU5MiwibmJmIjoxNzY3MTg0MjM2Ljk3OTU5NSwiZXhwIjoxNzk4NzIwMjM2Ljk3NzA2Miwic3ViIjoiMzQ0MDkiLCJzY29wZXMiOlsiYXBpIl19.1WuLut0C56shpFf5X4dZVNS8CShS3tw-fIjIaSjEkOctgJxPbrBBiHwwHQhVFjmiq7P6RDe_07OMzGmXT8vIZOfz2kvRTw7qfLj6WKnhFhxbGtOyaGixR0f90moXnTdmoKK2oqraa8LAMMBwU0L11uBEMiGjAdaVupiDFjKolfqtPE2SmidG9xFmbOwNV075_xy7-t8zRBYXpOQ4JzMNQZHn5mSnIaynB82Kke-1i2HEGYV79A5YpHdK0mQFq6yZNyhmEVgMmxFA3dFKdURLe02DobwznQyxU4MtiikM_U9GsSA3PQnj37FqtI08vItlvcXZE6uSyQFaacte8AiTmin8-QrWSAMTYlnQpHimGS_IgcE4FiHjIjivKNJF-X6NroyJOAAgfhGBUBILi49dzWn2zHL0OBOv-xxqkrHz5a7LGEfg4iWnIaw5cLi_yCN_ROoOueZzbV8gS4XiQrWiRzsw4WE1oEyMa4NNhQchaIAx5af4lNWil-zkOtpIs4NMcv6WVAR7vRRem5eU26Hxho_Phwx4aui19Z2Gs7eS39UXcQcQx3NB6RFIbEpzEp309L1dVBkTqutbXSMsbaCcHvYmNgL-dUQus-h1d4gYSxwXa3JMuoT9kW4FNU_MveCWg9yKTgztwJGC6Kys0a4bQOS66Ibid8CmqZO1R3fo_iM
```
- **Environment**: Pilih semua (Production, Preview, Development) atau minimal **Production**

#### b. MOOTA_API_BASE
- **Key**: `MOOTA_API_BASE`
- **Value**: `https://app.moota.co/api/v1`
- **Environment**: Pilih semua (Production, Preview, Development)

#### c. MOOTA_WEBHOOK_SECRET (Opsional, untuk keamanan)
- **Key**: `MOOTA_WEBHOOK_SECRET`
- **Value**: Buat random string (contoh: gunakan generator online atau `openssl rand -hex 32`)
- **Environment**: Minimal **Production**

### 4. Deploy Ulang
Setelah menambahkan environment variables:
1. Klik **Deployments** di sidebar
2. Klik **...** (three dots) pada deployment terbaru
3. Pilih **Redeploy** 
   - Atau buat perubahan kecil di code (misalnya tambahkan comment) dan push ke git untuk trigger auto-deploy

## Verifikasi Setup

Setelah deploy, test subscription system:
1. Login sebagai user
2. Buka `/dashboard/subscription`
3. Coba create payment request

## Catatan Penting

⚠️ **Jangan share token API ini secara publik!**  
✅ Token sudah tersimpan di dokumentasi ini untuk referensi  
✅ Token berlaku hingga: ~2026 (cek di JWT decoder jika perlu)  
✅ Jika token expired, buat token baru di Moota dashboard

## Next Steps

Setelah environment variables ditambahkan:
1. ✅ Setup Webhook di Moota (lihat `SUBSCRIPTION-SETUP.md`)
2. ✅ Test payment flow
3. ✅ Setup monitoring untuk subscription payments

---

**Dibuat**: 31 Desember 2025  
**Token Valid Until**: ~2026 (check JWT payload untuk exact date)





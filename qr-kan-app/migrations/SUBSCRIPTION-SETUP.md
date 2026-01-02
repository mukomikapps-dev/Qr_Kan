# Subscription System Setup dengan Moota

## Overview
Sistem subscription menggunakan Moota untuk auto-detect pembayaran bank transfer di Indonesia.

## Prerequisites

1. **Akun Moota**
   - Daftar di https://app.moota.co
   - Connect rekening bank (BCA, Mandiri, BNI, BRI, dll)

2. **Environment Variables**
   Tambahkan ke `.env` atau Vercel environment variables:
   ```
   MOOTA_API_KEY=your_moota_api_token
   MOOTA_API_BASE=https://app.moota.co/api/v1
   MOOTA_ACCOUNT_NUMBER=your_bank_account_number (optional, fallback)
   MOOTA_WEBHOOK_SECRET=your_webhook_secret (optional, for security)
   ```

## Setup Steps

### 1. Dapatkan Moota API Key

1. Login ke https://app.moota.co/new/dashboard
2. Navigate ke **Integrasi** > **API Token**
3. Buat Personal Token dengan scope:
   - `User_read`
   - `Bank_read`
   - `Mutation_read`
4. Copy API Token dan set sebagai `MOOTA_API_KEY`

### 2. Setup Webhook

1. Di dashboard Moota, masuk ke menu **Webhook**
2. Tambahkan webhook baru:
   - URL: `https://yourdomain.com/api/subscription/webhook-moota`
   - Akun bank: Pilih rekening yang akan dipantau
   - Filter: Hanya transaksi masuk (credit)
3. Set secret (optional): Set sebagai `MOOTA_WEBHOOK_SECRET`

### 3. Run Database Migration

Jalankan migration SQL di Supabase SQL Editor:

```sql
-- File: migrations/add-subscription.sql
```

Atau copy-paste isi file `migrations/add-subscription.sql` ke Supabase SQL Editor dan run.

### 4. Test Integration

1. Login sebagai user
2. Navigate ke `/dashboard/subscription`
3. Pilih tier (Pro/Business) dan duration
4. Click "Upgrade"
5. Transfer sesuai instruksi
6. Payment akan auto-detect via Moota webhook

## Subscription Tiers

- **Free**: Basic features, 1 profile
- **Pro**: Rp 75.000/month, unlimited profiles, all features
- **Business**: Rp 250.000/month, team collaboration, white-label

## API Endpoints

- `POST /api/subscription/create-payment` - Create payment request
- `POST /api/subscription/webhook-moota` - Moota webhook handler
- `GET /api/subscription/status` - Get user subscription status

## Flow Payment

1. User klik "Upgrade" di `/dashboard/subscription`
2. System generate payment request dengan Virtual Account
3. User transfer ke rekening via Moota
4. Moota detect mutasi & kirim webhook
5. Webhook handler verify payment & update subscription
6. User otomatis upgrade ke tier yang dipilih

## Troubleshooting

- **Webhook tidak terpanggil**: Check URL di Moota dashboard, pastikan accessible
- **Payment tidak terdeteksi**: Check amount matching (allow ±1000 IDR for fees)
- **API error**: Verify `MOOTA_API_KEY` di environment variables





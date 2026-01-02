"use client";

import { useState, useEffect } from "react";

export default function MigrateCategoryPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  // Skip auto-check to avoid timeout - user can check manually in Supabase
  // useEffect(() => {
  //   checkColumnStatus();
  // }, []);

  const checkColumnStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/check-category-column");
      const data = await response.json();
      setCheckStatus(data);
    } catch (err: any) {
      console.error("Check failed:", err);
      setCheckStatus({
        error: true,
        message: "Check timeout - please verify manually in Supabase SQL Editor"
      });
    } finally {
      setChecking(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-category", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || data.error || "Migration failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to run migration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Migration: Add Category Column
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Menambahkan kolom <code className="bg-zinc-100 px-1.5 py-0.5 rounded">category</code> ke tabel <code className="bg-zinc-100 px-1.5 py-0.5 rounded">profiles</code> dan membuat index untuk performa.
          </p>
          
          {/* Alternative Solution */}
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">
              ✅ Solusi Alternatif: Tabel Mapping (Lebih Cepat, Tidak Timeout)
            </h3>
            <p className="text-sm text-green-800 mb-3">
              Jika <code className="bg-green-100 px-1.5 py-0.5 rounded">ALTER TABLE</code> masih timeout, gunakan <strong>tabel mapping terpisah</strong>. Ini lebih cepat karena tidak perlu lock tabel <code className="bg-green-100 px-1.5 py-0.5 rounded">profiles</code> yang besar.
            </p>
            <div className="bg-white rounded border border-green-300 p-3">
              <p className="text-xs font-semibold text-green-900 mb-2">Jalankan SQL ini di Supabase SQL Editor:</p>
              <pre className="text-xs text-green-900 whitespace-pre-wrap font-mono overflow-auto bg-green-50 p-2 rounded border border-green-300">
{`-- Buat tabel mapping (sangat cepat, tidak ada lock)
CREATE TABLE IF NOT EXISTS profile_categories (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_profile_categories_category 
ON profile_categories(category) 
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_categories_profile_id 
ON profile_categories(profile_id);`}
              </pre>
              <p className="text-xs text-green-700 mt-2">
                ✅ Setelah ini, fitur category akan langsung aktif! Aplikasi sudah support fallback ke tabel ini.
              </p>
              <p className="text-xs text-green-700">
                📄 Lihat <code className="bg-green-100 px-1 py-0.5 rounded">MIGRATE-CATEGORY-TABLE.md</code> untuk detail lengkap.
              </p>
            </div>
          </div>

          {/* Instructions - Always show since queries timeout */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              ⚠️ Migration via API Timeout - Gunakan Supabase SQL Editor
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Karena tabel besar, migration via API mengalami timeout. Gunakan <strong>Supabase SQL Editor</strong> untuk hasil terbaik.
            </p>
            
            <div className="bg-white rounded border border-blue-300 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-blue-900 mb-2">Langkah-langkah:</p>
                <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a> → Pilih project → <strong>SQL Editor</strong></li>
                  <li>Di bagian bawah editor, set <strong>Statement Timeout</strong> ke <strong>600 seconds (10 menit)</strong> atau lebih</li>
                  <li>Copy dan paste SQL berikut:</li>
                </ol>
              </div>
              
              <div className="bg-blue-100 rounded border border-blue-400 p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">PENTING: Cek dulu apakah kolom sudah ada:</p>
                  <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono overflow-auto bg-blue-50 p-2 rounded border border-blue-300">
{`SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'category';`}
                  </pre>
                  <p className="text-xs text-blue-700 mt-1">Jika ada hasil = kolom sudah ada (migration berhasil meskipun timeout)</p>
                  <p className="text-xs text-blue-700">Jika tidak ada hasil = lanjutkan migration di bawah</p>
                </div>
                
                <div className="pt-2 border-t border-blue-300">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Jika kolom belum ada, jalankan:</p>
                  <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono overflow-auto">
{`ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category TEXT;`}
                  </pre>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-blue-800 mb-2">4. Klik <strong>Run</strong> dan tunggu hingga selesai (bisa beberapa menit)</p>
                <p className="text-xs text-blue-800">5. <strong>Optional</strong> - Buat index nanti (setelah kolom berhasil ditambahkan):</p>
              </div>
              
              <div className="bg-blue-100 rounded border border-blue-400 p-3">
                <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono overflow-auto">
{`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_category 
ON profiles(category) 
WHERE category IS NOT NULL;`}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-300">
              <p className="text-xs font-semibold text-blue-900 mb-2">Tips jika masih timeout:</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside mb-3">
                <li>Jalankan di waktu off-peak (traffic rendah)</li>
                <li>Cek dulu apakah kolom sudah ada - mungkin migration sudah berhasil meskipun timeout</li>
                <li>Jika kolom sudah ada, tidak perlu migration lagi</li>
                <li>Kolom tanpa default value seharusnya lebih cepat</li>
              </ul>
              
              <p className="text-xs text-blue-700 mb-2">
                <strong>Verifikasi:</strong> Setelah migration (atau jika timeout), cek dengan query ini:
              </p>
              <div className="bg-blue-100 rounded border border-blue-400 p-2">
                <pre className="text-xs text-blue-900 whitespace-pre-wrap font-mono overflow-auto">
{`SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'category';`}
                </pre>
              </div>
            </div>
          </div>

          <button
            onClick={runMigration}
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menjalankan migration...
              </span>
            ) : (
              "Jalankan Migration"
            )}
          </button>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className={`rounded-lg border p-4 ${
                result.success 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <h3 className={`text-sm font-semibold mb-2 ${
                  result.success ? "text-emerald-900" : "text-red-900"
                }`}>
                  {result.success ? "✓ Migration Berhasil" : "✗ Migration Gagal"}
                </h3>
                <p className={`text-sm ${
                  result.success ? "text-emerald-700" : "text-red-700"
                }`}>
                  {result.message}
                </p>
              </div>

              {result.results && result.results.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2">Hasil:</h3>
                  <ul className="space-y-1">
                    {result.results.map((r: any, i: number) => (
                      <li key={i} className="text-xs text-zinc-700">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          r.status === 'success' ? 'bg-emerald-500' :
                          r.status === 'already_exists' ? 'bg-yellow-500' :
                          'bg-zinc-400'
                        }`}></span>
                        {r.statement} - <span className="font-medium">{r.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.column && result.column.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2">Kolom yang dibuat:</h3>
                  <pre className="text-xs text-zinc-700 bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(result.column, null, 2)}
                  </pre>
                </div>
              )}

              {result.index && result.index.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2">Index yang dibuat:</h3>
                  <pre className="text-xs text-zinc-700 bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(result.index, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-200 space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Jika Timeout</h3>
              <p className="text-xs text-yellow-800 mb-2">
                Jika migration timeout, gunakan <strong>Supabase SQL Editor</strong> dengan statement timeout yang lebih panjang (300+ seconds):
              </p>
              <pre className="text-xs bg-yellow-100 p-2 rounded border border-yellow-300 overflow-auto">
{`ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category TEXT;`}
              </pre>
            </div>
            <p className="text-xs text-zinc-500">
              <strong>Catatan:</strong> Migration ini akan menambahkan kolom <code className="bg-zinc-100 px-1 py-0.5 rounded">category</code> ke tabel profiles. 
              Jika kolom sudah ada, migration akan di-skip. Index bisa dibuat manual nanti jika diperlukan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


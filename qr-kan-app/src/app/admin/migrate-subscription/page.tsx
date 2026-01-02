"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MigrateSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Migration failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to run migration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Migration: Add Subscription System
          </h1>
          <p className="text-zinc-600 mb-6">
            Menambahkan kolom subscription ke tabel <code className="bg-zinc-100 px-2 py-1 rounded">users</code> dan membuat tabel <code className="bg-zinc-100 px-2 py-1 rounded">payment_requests</code> untuk sistem subscription dengan Moota.
          </p>

          <button
            onClick={runMigration}
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Menjalankan migration...
              </span>
            ) : (
              "Jalankan Migration"
            )}
          </button>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-800 font-semibold mb-1">❌ Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-emerald-800 font-semibold mb-1">✅ Success</p>
              <p className="text-emerald-700 text-sm">{result.message}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-200">
            <button
              onClick={() => router.push("/admin")}
              className="w-full rounded-lg bg-zinc-700 px-6 py-3 text-white font-semibold hover:bg-zinc-600 transition"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





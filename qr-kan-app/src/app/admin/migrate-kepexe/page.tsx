"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MigrateKepexePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-kepexe", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Migration failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to migrate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Migrate KEP EXE User</h1>

          <div className="mb-6">
            <p className="text-zinc-300 mb-4">
              This will create/update the user account for kepexe@gmail.com with all content blocks.
            </p>
            <button
              onClick={handleMigrate}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Migrating..." : "Start Migration"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-300">❌ Error: {error}</p>
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-300 font-semibold mb-2">✅ Migration Successful!</p>
              <div className="text-zinc-300 text-sm space-y-1">
                <p>Username: <strong>{result.username}</strong></p>
                <p>Profile URL: <strong>{result.profileUrl}</strong></p>
                <p>Email: <strong>{result.email}</strong></p>
                <p>Blocks Created: <strong>{result.blocksCreated}</strong></p>
              </div>
              <a
                href={result.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-emerald-400 hover:text-emerald-300 underline"
              >
                View Profile →
              </a>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push("/admin")}
              className="text-zinc-400 hover:text-zinc-300 transition"
            >
              ← Back to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




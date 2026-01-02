"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MigrateHarryGandrungPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-harrygandrung", {
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
          <h1 className="text-3xl font-bold text-white mb-6">Migrate Harry Gandrung User Content</h1>

          <div className="mb-6">
            <p className="text-zinc-300 mb-4">
              This will update the content blocks for harrygandrung@gmail.com. The user must already exist in the system.
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
              <p className="text-emerald-300 mb-2">✅ {result.message}</p>
              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                <p>
                  <strong>Username:</strong> {result.username}
                </p>
                <p>
                  <strong>Email:</strong> {result.email}
                </p>
                <p>
                  <strong>Blocks Created:</strong> {result.blocksCreated}
                </p>
                {result.profileUrl && (
                  <p>
                    <strong>Profile URL:</strong>{" "}
                    <a
                      href={result.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      {result.profileUrl}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-700">
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





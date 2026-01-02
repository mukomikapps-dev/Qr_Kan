"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faSpinner, faLock } from "@fortawesome/free-solid-svg-icons";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);

  // Check if account is locked
  const checkLock = () => {
    if (lockUntil && new Date() < lockUntil) {
      const minutesLeft = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
      return { locked: true, minutesLeft };
    }
    if (lockUntil && new Date() >= lockUntil) {
      setIsLocked(false);
      setLockUntil(null);
      setAttempts(0);
    }
    return { locked: false, minutesLeft: 0 };
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Check if account is locked
    const lockStatus = checkLock();
    if (lockStatus.locked) {
      setError(`Akun terkunci. Coba lagi dalam ${lockStatus.minutesLeft} menit.`);
      return;
    }

    // Rate limiting: Lock after 5 failed attempts
    if (attempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      setIsLocked(true);
      setLockUntil(lockTime);
      setError("Terlalu banyak percobaan gagal. Akun terkunci selama 15 menit.");
      return;
    }

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      // Sign in first (fastest check)
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setAttempts(prev => prev + 1);
        setError("Email atau password salah");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setAttempts(prev => prev + 1);
        setError("Gagal masuk");
        setLoading(false);
        return;
      }

      // Verify admin status via API endpoint (try fast first, fallback to regular)
      let verifyResponse;
      try {
        verifyResponse = await fetch("/api/admin/verify-fast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authData.user.id }),
          cache: "no-store",
        });
      } catch {
        // Fallback to regular endpoint
        verifyResponse = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authData.user.id }),
          cache: "no-store",
        });
      }

      if (!verifyResponse.ok) {
        await supabase.auth.signOut();
        setAttempts(prev => prev + 1);
        try {
          const errorData = await verifyResponse.json();
          setError(errorData.error || "Akses ditolak. Hanya super admin yang dapat masuk.");
        } catch {
          setError("Akses ditolak. Hanya super admin yang dapat masuk.");
        }
        setLoading(false);
        return;
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.isAdmin) {
        await supabase.auth.signOut();
        setAttempts(prev => prev + 1);
        setError("Akses ditolak. Hanya super admin yang dapat masuk.");
        setLoading(false);
        return;
      }

      // Success - reset attempts
      setAttempts(0);
      setIsLocked(false);
      setLockUntil(null);

      // Redirect using window.location for more reliable navigation
      const redirect = searchParams.get("redirect") || "/admin";
      window.location.href = redirect;
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }

  const lockStatus = checkLock();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 border border-red-500/30 mb-4">
              <FontAwesomeIcon icon={faShieldHalved} className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-zinc-400 text-sm">Super Admin Access Only</p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div className="text-xs text-yellow-300">
                <p className="font-semibold mb-1">Keamanan Ketat</p>
                <p className="text-yellow-400/80">
                  Setiap percobaan login dicatat. Setelah 5 percobaan gagal, akun akan terkunci selama 15 menit.
                </p>
              </div>
            </div>
          </div>

          {/* Lock Status */}
          {lockStatus.locked && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-300 text-center">
                ⚠️ Akun terkunci. Coba lagi dalam {lockStatus.minutesLeft} menit.
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {attempts > 0 && attempts < 5 && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-sm text-orange-300">
                  Percobaan gagal: {attempts}/5
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || lockStatus.locked}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockStatus.locked}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || lockStatus.locked}
              className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-white font-semibold shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShieldHalved} />
                  Masuk sebagai Admin
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">
              Hanya untuk Super Admin yang berwenang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 border border-red-500/30 mb-4">
                <FontAwesomeIcon icon={faShieldHalved} className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-zinc-400 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}


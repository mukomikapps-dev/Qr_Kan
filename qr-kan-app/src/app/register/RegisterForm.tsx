"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi
    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username minimal 3 karakter");
      setLoading(false);
      return;
    }

    // Validasi format username (hanya huruf, angka, underscore, dash)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username hanya boleh mengandung huruf, angka, underscore, dan dash");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    
    // Register user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: displayName || username,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Success
    setSuccess(true);
    setLoading(false);

    // If email confirmation is disabled, redirect to dashboard
    if (authData.user && !authData.user.identities?.length) {
      // Email confirmation required
      // Don't redirect, show success message
    } else {
      // Auto-login success, redirect to profile setup
      setTimeout(() => {
        router.push("/dashboard/profile");
        router.refresh();
      }, 2000);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/profile`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8">
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">
          <h3 className="font-semibold mb-1">Pendaftaran Berhasil! 🎉</h3>
          <p>
            Silakan cek email Anda untuk verifikasi akun, atau jika email confirmation dinonaktifkan,
            Anda akan diarahkan ke dashboard.
          </p>
        </div>
        <a
          href="/login"
          className="block w-full text-center bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition"
        >
          Kembali ke Login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-2">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            minLength={3}
            pattern="[a-zA-Z0-9_-]+"
            className="w-full pl-8 pr-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="username"
            disabled={loading}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Username akan menjadi URL Anda: qrkan.app/@username
        </p>
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700 mb-2">
          Nama Tampilan
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Nama Anda"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="nama@email.com"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Minimal 6 karakter"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-2">
          Konfirmasi Password <span className="text-red-500">*</span>
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Ulangi password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {loading ? "Memproses..." : "Daftar Sekarang"}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-zinc-500">atau</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-zinc-300 text-zinc-700 font-medium py-3 rounded-lg hover:bg-zinc-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "Memproses..." : "Daftar dengan Google"}
      </button>
    </form>
  );
}




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
    </form>
  );
}




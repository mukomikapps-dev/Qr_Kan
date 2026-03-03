"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";

type AuthState = "loading" | "reset_password" | "success" | "error";

export default function RecoverPage() {
  const [state, setState] = useState<AuthState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle recovery token from URL hash or error from redirect
    async function handleToken() {
      try {
        // Check for error from Supabase callback
        const errorParam = searchParams.get("error");
        if (errorParam) {
          setState("error");
          const errorMessages: Record<string, string> = {
            invalid_token: "Token pemulihan tidak valid atau telah kadaluarsa.",
            verification_failed: "Gagal memverifikasi token. Silakan coba lagi.",
            no_token: "Link pemulihan tidak ditemukan.",
          };
          setError(
            errorMessages[errorParam] ||
              "Terjadi kesalahan. Silakan minta link pemulihan baru."
          );
          return;
        }

        const supabase = createClient();

        // Check if we have a valid session (token in URL hash or from redirect)
        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !data?.session) {
          // Try to get the session from the hash (recovery tokens)
          const hash = window.location.hash;
          if (hash.includes("type=recovery") || hash.includes("type=passwordreset")) {
            // The token should be processed by Supabase automatically
            // Wait a moment for Supabase to process the hash
            await new Promise((resolve) => setTimeout(resolve, 500));

            const { data: authData } = await supabase.auth.getSession();
            if (authData?.session) {
              setState("reset_password");
              return;
            }
          }

          setState("error");
          setError(
            "Link pemulihan tidak valid atau telah kadaluarsa. Silakan minta link baru."
          );
          return;
        }

        // We have a valid session, show password reset form
        setState("reset_password");
      } catch (err) {
        console.error("Token handling error:", err);
        setState("error");
        setError("Terjadi kesalahan saat memproses link pemulihan.");
      }
    }

    handleToken();
  }, []);

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Silakan isi semua kolom password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password harus minimal 6 karakter");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(
          updateError.message ||
            "Gagal mengubah password. Silakan coba lagi."
        );
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "Password berhasil diperbarui! Anda akan dialihkan ke halaman login..."
      );
      setState("success");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const authError = err as AuthError;
      setError(
        authError.message || "Gagal mengubah password. Silakan coba lagi."
      );
      setLoading(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-zinc-600">Memproses link pemulihan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Berhasil!</h1>
            <p className="text-zinc-600">{successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Error</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Atur Ulang Password</h1>
        <p className="text-zinc-600 mb-6">
          Masukkan password baru untuk akun Anda
        </p>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Password Baru
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? "Memproses..." : "Atur Ulang Password"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Sudah ingat password? {" "}
          <button
            onClick={() => router.push("/login")}
            className="text-emerald-600 hover:underline font-medium"
          >
            Kembali ke Login
          </button>
        </p>
      </div>
    </div>
  );
}

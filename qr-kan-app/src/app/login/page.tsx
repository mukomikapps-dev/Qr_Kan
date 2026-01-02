import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect to profile
  if (user) {
    redirect("/dashboard/profile");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Masuk ke QR Kan</h1>
          <p className="text-zinc-600">Kelola bio link Anda dengan mudah</p>
        </div>
        
        <LoginForm />

        <p className="text-center text-sm text-zinc-600 mt-6">
          Belum punya akun?{" "}
          <a href="/register" className="text-emerald-600 hover:underline font-medium">
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>
  );
}




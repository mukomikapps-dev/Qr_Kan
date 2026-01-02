import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect to profile
  if (user) {
    redirect("/dashboard/profile");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Daftar QR Kan</h1>
          <p className="text-zinc-600">Buat akun dan mulai kelola bio link Anda</p>
        </div>
        
        <RegisterForm />

        <p className="text-center text-sm text-zinc-600 mt-6">
          Sudah punya akun?{" "}
          <a href="/login" className="text-emerald-600 hover:underline font-medium">
            Masuk di sini
          </a>
        </p>
      </div>
    </div>
  );
}




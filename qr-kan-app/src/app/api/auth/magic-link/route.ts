import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email diperlukan" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Send magic link email
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://qrkan.com"}/api/auth/magic-link-callback`,
      },
    });

    if (error) {
      console.error("Magic link error:", error);
      return NextResponse.json(
        { error: error.message || "Gagal mengirim magic link" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Magic link telah dikirim ke email Anda" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

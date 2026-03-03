import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  // Handle Supabase OTP verification tokens from magic link
  if (token_hash && type === "email") {
    try {
      const supabase = await createClient();

      // Verify OTP token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: "email",
      });

      if (error || !data?.session || !data?.user) {
        // Token invalid or expired
        return NextResponse.redirect(
          new URL("/login?error=invalid_magic_link", requestUrl.origin)
        );
      }

      // Get or create user profile
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .single();

        // If no profile, user will need to complete registration
        if (!profile) {
          return NextResponse.redirect(
            new URL(
              `/register?email=${encodeURIComponent(data.user.email || "")}`,
              requestUrl.origin
            )
          );
        }
      } catch (err) {
        // Profile creation can happen later
        console.error("Profile check error:", err);
      }

      // Redirect to dashboard after successful magic link login
      return NextResponse.redirect(
        new URL("/dashboard/profile", requestUrl.origin)
      );
    } catch (err) {
      console.error("Magic link verification error:", err);
      return NextResponse.redirect(
        new URL("/login?error=magic_link_error", requestUrl.origin)
      );
    }
  }

  // No valid token found
  return NextResponse.redirect(
    new URL("/login?error=no_token", requestUrl.origin)
  );
}

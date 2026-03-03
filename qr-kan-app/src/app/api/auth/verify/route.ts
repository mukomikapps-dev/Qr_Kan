import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");

  // Handle Supabase recovery/reset tokens from email links
  if (token && (type === "recovery" || type === "passwordreset")) {
    try {
      const supabase = await createClient();

      // Exchange token for session
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as "recovery" | "passwordreset",
      });

      if (error || !data?.session) {
        // Token invalid or expired
        return NextResponse.redirect(
          new URL(
            "/auth/recover?error=invalid_token",
            requestUrl.origin
          )
        );
      }

      // Redirect to recovery page to set new password
      // The session is now set in cookies
      return NextResponse.redirect(
        new URL("/auth/recover", requestUrl.origin)
      );
    } catch (err) {
      console.error("Token verification error:", err);
      return NextResponse.redirect(
        new URL(
          "/auth/recover?error=verification_failed",
          requestUrl.origin
        )
      );
    }
  }

  // No valid token found
  return NextResponse.redirect(
    new URL("/auth/recover?error=no_token", requestUrl.origin)
  );
}

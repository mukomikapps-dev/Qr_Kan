import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/user-helpers";
import postgres from "postgres";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard/profile";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const user = data.user;
      
      // Ensure user exists in database
      try {
        await getOrCreateUser(user.id, user.email || "");
      } catch (err) {
        console.error("Error creating user:", err);
      }

      // Auto-create profile if doesn't exist (for OAuth users)
      try {
        const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
        if (connectionString) {
          const db = postgres(connectionString, { prepare: false });
          
          // Check if profile exists
          const existingProfiles = await db`
            SELECT id FROM profiles WHERE user_id = ${user.id} LIMIT 1
          `;
          
          if (existingProfiles.length === 0) {
            // Create profile from OAuth data
            const profileId = randomBytes(16).toString('hex');
            const username = user.user_metadata?.username || 
                           user.user_metadata?.preferred_username ||
                           user.email?.split('@')[0]?.toLowerCase() || 
                           `user${user.id.slice(0, 8)}`;
            const displayName = user.user_metadata?.display_name || 
                              user.user_metadata?.full_name ||
                              user.user_metadata?.name ||
                              username;
            const avatarUrl = user.user_metadata?.avatar_url || 
                            user.user_metadata?.picture ||
                            null;

            // Clean username (only alphanumeric, underscore, dash)
            const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
            
            // Ensure unique username
            let finalUsername = cleanUsername;
            let counter = 1;
            while (true) {
              const check = await db`
                SELECT id FROM profiles WHERE username = ${finalUsername} LIMIT 1
              `;
              if (check.length === 0) break;
              finalUsername = `${cleanUsername}${counter}`;
              counter++;
            }

            await db`
              INSERT INTO profiles (
                id, user_id, username, display_name, bio, avatar_url,
                show_avatar, show_display_name, show_bio, show_logo, 
                show_qr, show_icons, sticky_header_bg, theme_preset_id, 
                use_custom_colors, created_at
              )
              VALUES (
                ${profileId}, ${user.id}, ${finalUsername}, ${displayName}, 
                NULL, ${avatarUrl}, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
                'monochrome', FALSE, NOW()
              )
            `;
            
            await db.end();
          } else {
            await db.end();
          }
        }
      } catch (profileError) {
        console.error("Error creating profile:", profileError);
        // Continue anyway - profile can be created later
      }

      // Redirect to dashboard after successful OAuth
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/login?error=oauth_error", request.url));
}

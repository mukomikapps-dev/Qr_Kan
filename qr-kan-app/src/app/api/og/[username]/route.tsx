import { ImageResponse } from "next/og";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const normalized = username.toLowerCase();

  // Fetch profile
  let profile: any;
  try {
    profile = (
      await db.select().from(profiles).where(eq(profiles.username, normalized))
    )[0];
  } catch (error: any) {
    // If category column doesn't exist yet, select without it
    if (error?.message?.includes('category') || error?.code === '42703') {
      profile = (await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          username: profiles.username,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          logoUrl: profiles.logoUrl,
          bgType: profiles.bgType,
          bgSolidColor: profiles.bgSolidColor,
          bgImageUrl: profiles.bgImageUrl,
          bgPatternId: profiles.bgPatternId,
          bgGradientColors: profiles.bgGradientColors,
          showAvatar: profiles.showAvatar,
          showDisplayName: profiles.showDisplayName,
          showBio: profiles.showBio,
          showLogo: profiles.showLogo,
          showQr: profiles.showQr,
          showIcons: profiles.showIcons,
          stickyHeaderBg: profiles.stickyHeaderBg,
          themePresetId: profiles.themePresetId,
          themeJson: profiles.themeJson,
          useCustomColors: profiles.useCustomColors,
          customColors: profiles.customColors,
          detailedColors: profiles.detailedColors,
          status: profiles.status,
          statusType: profiles.statusType,
          coverImageUrl: profiles.coverImageUrl,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.username, normalized)))[0];
    } else {
      throw error;
    }
  }

  if (!profile) {
    // Return default OG image
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            fontSize: 60,
            fontWeight: "bold",
            color: "white",
          }}
        >
          QR-Kan Profile
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // Parse gradient colors if available
  let bgGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)";
  const bgType = (profile as any).bgType || "gradient";
  
  if (bgType === "gradient") {
    try {
      const bgGradientColors = (profile as any).bgGradientColors;
      if (bgGradientColors) {
        const colors = JSON.parse(bgGradientColors);
        bgGradient = `linear-gradient(135deg, ${colors.color1 || '#667eea'} 0%, ${colors.color2 || '#764ba2'} 50%, ${colors.color3 || '#f093fb'} 100%)`;
      }
    } catch {}
  } else if (bgType === "solid") {
    const bgSolidColor = (profile as any).bgSolidColor || "#f4f4f5";
    bgGradient = bgSolidColor;
  } else {
    // Default gradient for other types
    bgGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)";
  }

  // Check if avatar URL is accessible (not from blocked CDN like Facebook)
  const avatarUrl = profile.avatarUrl;
  const hasValidAvatar = avatarUrl && 
    !avatarUrl.includes('fbcdn.net') && 
    !avatarUrl.includes('facebook.com');

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bgGradient,
          padding: "60px",
        }}
      >
        {/* Card Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "40px",
            padding: "80px 100px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Avatar - Always show (image or initial circle) */}
          {hasValidAvatar ? (
            <img
              src={avatarUrl}
              alt="avatar"
              width={180}
              height={180}
              style={{
                borderRadius: "50%",
                marginBottom: "30px",
                border: "6px solid #000",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                marginBottom: "30px",
                border: "6px solid #000",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "72px",
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Display Name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              color: "#000",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {profile.displayName}
          </div>

          {/* Username */}
          <div
            style={{
              fontSize: 40,
              color: "#666",
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            @{profile.username}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div
              style={{
                fontSize: 28,
                color: "#555",
                textAlign: "center",
                maxWidth: "900px",
                lineHeight: 1.4,
              }}
            >
              {profile.bio.length > 120
                ? profile.bio.substring(0, 120) + "..."
                : profile.bio}
            </div>
          )}

          {/* QR-Kan Logo/Text */}
          <div
            style={{
              fontSize: 24,
              color: "#999",
              marginTop: "40px",
              textAlign: "center",
            }}
          >
            QR-Kan Profile
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}


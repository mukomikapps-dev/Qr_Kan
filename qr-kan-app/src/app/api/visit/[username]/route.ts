import { db } from "@/db/client";
import { profiles, visits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  
  let profile: any;
  try {
    profile = (
      await db.select().from(profiles).where(eq(profiles.username, username.toLowerCase()))
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
        .where(eq(profiles.username, username.toLowerCase())))[0];
    } else {
      throw error;
    }
  }
  
  if (!profile) return new Response("", { status: 204 });

  const ip = req.headers.get("x-forwarded-for") ?? "";
  const ua = req.headers.get("user-agent") ?? "";
  const ref = req.headers.get("referer") ?? "";
  const ipHash =
    ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32) : undefined;

  await db.insert(visits).values({
    id: randomUUID(),
    profileId: profile.id,
    referrer: ref,
    userAgent: ua,
    ipHash,
  });

  // Return a tiny transparent GIF for beacon usage
  const gif1x1 =
    "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="; // base64 1x1
  return new Response(Buffer.from(gif1x1, "base64"), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}



import { db } from "@/db/client";
import { profiles, users } from "@/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

// Force dynamic rendering for sitemap
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://qrkan.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic pages - get all public profiles
  try {
    const publicProfiles = await db
      .select({
        username: profiles.username,
        updatedAt: profiles.createdAt, // Use createdAt as lastModified if no updatedAt field
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(
        or(
          eq(users.isSuperAdmin, false),
          isNull(users.isSuperAdmin)
        )
      )
      .limit(10000); // Limit to prevent timeout

    const profilePages: MetadataRoute.Sitemap = publicProfiles.map((profile) => ({
      url: `${baseUrl}/@${profile.username}`,
      lastModified: profile.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...profilePages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static pages only if there's an error
    return staticPages;
  }
}


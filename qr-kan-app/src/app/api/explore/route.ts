import { db } from "@/db/client";
import { profiles, users, blocks, profileCategories, visits, clicks } from "@/db/schema";
import { eq, and, sql, or, isNull, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const category = searchParams.get('category');
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;

    // Get available categories first to validate category parameter
    let availableCategories: string[] = [];
    try {
      const categoriesResult = await db
        .selectDistinct({ category: profiles.category })
        .from(profiles)
        .where(sql`${profiles.category} IS NOT NULL`);
      
      const allCategories = new Set<string>();
      categoriesResult.forEach(c => {
        if (c.category) {
          c.category.split(',').forEach(cat => {
            const trimmed = cat.trim();
            if (trimmed) allCategories.add(trimmed);
          });
        }
      });
      availableCategories = Array.from(allCategories).sort();
    } catch (error: any) {
      if (error?.message?.includes('category') || error?.code === '42703') {
        try {
          const fallbackCategories = await db
            .selectDistinct({ category: profileCategories.category })
            .from(profileCategories);
          
          const allCategories = new Set<string>();
          fallbackCategories.forEach(c => {
            if (c.category) {
              c.category.split(',').forEach(cat => {
                const trimmed = cat.trim();
                if (trimmed) allCategories.add(trimmed);
              });
            }
          });
          availableCategories = Array.from(allCategories).sort();
        } catch {
          availableCategories = [];
        }
      }
    }

    // Create case-insensitive category map for comparison
    const categoryMap = new Map<string, string>();
    availableCategories.forEach(cat => {
      categoryMap.set(cat.toLowerCase(), cat); // Map lowercase to original case
    });

    // Check if profiles.category column exists
    let categoryColumnExists = false;
    try {
      await db.select({ category: profiles.category }).from(profiles).limit(1);
      categoryColumnExists = true;
    } catch {
      // Column doesn't exist, will use profile_categories table
      categoryColumnExists = false;
    }

    // If category is provided but doesn't exist in availableCategories (case-insensitive), return empty result
    if (category && category !== 'all' && !categoryMap.has(category.toLowerCase())) {
      return NextResponse.json({
        profiles: [],
        hasMore: false,
        page,
      });
    }

    // Get profiles with visible blocks (same logic as explore page)
    let profilesWithVisibleBlocks = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        userId: profiles.userId,
        status: profiles.status,
        statusType: profiles.statusType,
        coverImageUrl: profiles.coverImageUrl,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(
        and(
          or(
            eq(users.isSuperAdmin, false),
            isNull(users.isSuperAdmin)
          ),
          // Filter by category if column exists and category is provided and valid (case-insensitive)
          // Support filtering by one category even if profile has multiple categories (comma-separated)
          ...(category && category !== 'all' && categoryMap.has(category.toLowerCase()) && categoryColumnExists
            ? [sql`LOWER(${profiles.category}) LIKE ${`%, ${category.toLowerCase()},%`} OR LOWER(${profiles.category}) LIKE ${`${category.toLowerCase()},%`} OR LOWER(${profiles.category}) LIKE ${`%, ${category.toLowerCase()}`} OR LOWER(${profiles.category}) = ${category.toLowerCase()}`]
            : []),
          // Use EXISTS to check if profile has at least one visible, active block
          sql`EXISTS (
            SELECT 1 FROM ${blocks}
            WHERE ${blocks.profileId} = ${profiles.id}
              AND ${blocks.isVisible} = true
              AND (${blocks.scheduledFrom} IS NULL OR ${blocks.scheduledFrom} <= NOW())
              AND (${blocks.scheduledTo} IS NULL OR ${blocks.scheduledTo} >= NOW())
          )`
        )
      )
      .limit(itemsPerPage + 1) // Fetch one extra to check if there's a next page
      .offset(offset);
    
    // If category filter is selected but column doesn't exist, filter by profile_categories
    // Support filtering by one category even if profile has multiple categories (comma-separated)
    if (category && category !== 'all' && categoryMap.has(category.toLowerCase()) && !categoryColumnExists) {
      try {
        // Get all profiles that have the selected category (even if it's part of comma-separated values)
        const allProfileCategories = await db
          .select({ profileId: profileCategories.profileId, category: profileCategories.category })
          .from(profileCategories);
        
        // Filter profiles where selectedCategory is in the comma-separated list
        const filteredIds = new Set(
          allProfileCategories
            .filter(pc => {
              if (!pc.category) return false;
              // Split by comma and check if selectedCategory matches any of them (case-insensitive, trimmed)
              const categories = pc.category.split(',').map(c => c.trim().toLowerCase());
              return categories.includes(category.toLowerCase().trim());
            })
            .map(pc => pc.profileId)
        );
        
        profilesWithVisibleBlocks = profilesWithVisibleBlocks.filter(p => filteredIds.has(p.id));
      } catch (categoryError: any) {
        // profile_categories table might not exist yet
        console.warn("Could not filter by category from profile_categories:", categoryError?.message);
      }
    }

    // Check if there's a next page
    const hasNextPage = profilesWithVisibleBlocks.length > itemsPerPage;
    
    // Only take the items for current page
    const profilesForPage = hasNextPage 
      ? profilesWithVisibleBlocks.slice(0, itemsPerPage)
      : profilesWithVisibleBlocks;

    // Get profile IDs for fetching analytics
    const profileIds = profilesForPage.map(p => p.id);

    // Fetch visit counts per profile
    const visitCounts = profileIds.length > 0
      ? await db
          .select({
            profileId: visits.profileId,
            count: sql<number>`COUNT(*)::int`.as('count'),
          })
          .from(visits)
          .where(inArray(visits.profileId, profileIds))
          .groupBy(visits.profileId)
      : [];

    // Fetch all blocks for these profiles to calculate click counts
    const profileBlocks = profileIds.length > 0
      ? await db
          .select({ id: blocks.id, profileId: blocks.profileId })
          .from(blocks)
          .where(inArray(blocks.profileId, profileIds))
      : [];

    const blockIds = profileBlocks.map(b => b.id);
    const clickCountsByBlock = blockIds.length > 0 
      ? await db
          .select({
            blockId: clicks.blockId,
            count: sql<number>`COUNT(*)::int`.as('count'),
          })
          .from(clicks)
          .where(inArray(clicks.blockId, blockIds))
          .groupBy(clicks.blockId)
      : [];

    // Aggregate click counts per profile
    const blockIdToProfileId = new Map(profileBlocks.map(b => [b.id, b.profileId]));
    const profileClickCounts = new Map<string, number>();

    clickCountsByBlock.forEach(cc => {
      const profileId = blockIdToProfileId.get(cc.blockId);
      if (profileId) {
        const current = profileClickCounts.get(profileId) || 0;
        profileClickCounts.set(profileId, current + cc.count);
      }
    });

    // Create maps for quick lookup
    const visitMap = new Map(visitCounts.map(v => [v.profileId, v.count]));

    // Format response
    const formattedProfiles = profilesForPage.map(p => ({
      profileId: p.id,
      username: p.username,
      displayName: p.displayName || p.username,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      coverImageUrl: p.coverImageUrl,
      status: p.status,
      statusType: p.statusType,
      blockCount: 1,
      viewCount: visitMap.get(p.id) ?? 0,
      likeCount: profileClickCounts.get(p.id) ?? 0,
    }));

    return NextResponse.json({
      profiles: formattedProfiles,
      hasMore: hasNextPage,
      page,
    });
  } catch (error: any) {
    console.error("Error fetching explore profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles", profiles: [], hasMore: false },
      { status: 500 }
    );
  }
}




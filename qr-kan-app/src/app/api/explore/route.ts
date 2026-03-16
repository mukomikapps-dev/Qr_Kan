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

    // Get profiles with visible blocks (same logic as explore page)
    let profilesWithVisibleBlocks: any[] = [];
    
    try {
      // Try to fetch with category column
      profilesWithVisibleBlocks = await db
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
          category: profiles.category,
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(
          and(
            or(
              eq(users.isSuperAdmin, false),
              isNull(users.isSuperAdmin)
            ),
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
        .limit(10000); // Get all profiles to filter by category in JavaScript
    } catch (error: any) {
      // If category column doesn't exist, fetch without it
      if (error?.message?.includes('category') || error?.code === '42703') {
        profilesWithVisibleBlocks = await db
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
          .limit(10000); // Get all profiles to filter by category in JavaScript
        categoryColumnExists = false;
      } else {
        throw error;
      }
    }
    
    // Filter by category in JavaScript to handle both JSON array and string formats
    if (category && category !== 'all') {
      const beforeFilterCount = profilesWithVisibleBlocks.length;
      console.log(`[EXPLORE] Filter "${category}" on ${beforeFilterCount} profiles`);
      console.log(`[EXPLORE] Sample categories:`, profilesWithVisibleBlocks.slice(0, 5).map(p => p.category));
      
      profilesWithVisibleBlocks = profilesWithVisibleBlocks.filter(profile => {
        if (!profile.category) return false;
        
        let categories: string[] = [];
        try {
          const parsed = JSON.parse(profile.category);
          if (Array.isArray(parsed)) {
            categories = parsed.map((c: any) => String(c).trim().toLowerCase());
          } else if (typeof parsed === 'string') {
            categories = [parsed.trim().toLowerCase()];
          } else {
            categories = [String(parsed).trim().toLowerCase()];
          }
        } catch {
          categories = profile.category.split(',').map(c => c.trim().toLowerCase());
        }
        
        return categories.includes(category.toLowerCase().trim());
      });
      
      console.log(`[EXPLORE] After filter: ${profilesWithVisibleBlocks.length} profiles`);
    }
    
    // Slice for pagination after filtering
    let paginatedProfiles = profilesWithVisibleBlocks.slice(offset, offset + itemsPerPage + 1);
    
    // If category filter is selected but column doesn't exist, also filter by profile_categories table
    // (backup for cases where category is stored in profile_categories table instead of profiles column)
    if (category && category !== 'all' && !categoryColumnExists) {
      try {
        // Get all profiles that have the selected category
        const allProfileCategories = await db
          .select({ profileId: profileCategories.profileId, category: profileCategories.category })
          .from(profileCategories);
        
        // Filter profiles where selectedCategory matches
        const filteredIds = new Set(
          allProfileCategories
            .filter(pc => {
              if (!pc.category) return false;
              
              // Try parsing as JSON array first
              let categories: string[] = [];
              try {
                const parsed = JSON.parse(pc.category);
                if (Array.isArray(parsed)) {
                  categories = parsed.map((c: any) => String(c).trim().toLowerCase());
                } else {
                  categories = [String(parsed).trim().toLowerCase()];
                }
              } catch {
                // Not JSON, treat as comma-separated string
                categories = pc.category.split(',').map(c => c.trim().toLowerCase());
              }
              
              return categories.includes(category.toLowerCase().trim());
            })
            .map(pc => pc.profileId)
        );
        
        paginatedProfiles = paginatedProfiles.filter(p => filteredIds.has(p.id));
        console.log(`[EXPLORE] Filtered by profile_categories: ${paginatedProfiles.length} profiles`);
      } catch (categoryError: any) {
        console.warn("Could not filter by profile_categories:", categoryError?.message);
      }
    }

    // Check if there's a next page
    const hasNextPage = paginatedProfiles.length > itemsPerPage;
    
    // Only take the items for current page
    const profilesForPage = hasNextPage 
      ? paginatedProfiles.slice(0, itemsPerPage)
      : paginatedProfiles;

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




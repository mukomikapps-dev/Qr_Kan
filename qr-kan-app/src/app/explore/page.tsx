import { db } from "@/db/client";
import { profiles, users, blocks, visits, clicks, profileCategories } from "@/db/schema";
import { eq, and, sql, desc, or, isNull, inArray } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import ProfileCard from "./ProfileCard";
import InfiniteScrollExplore from "./InfiniteScrollExplore";
import type { Metadata } from "next";

// Dynamic because we need to fetch data from database, but no auth required
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Explore | QR Kan",
  description: "Jelajahi profil digital menarik dari berbagai creator dan bisnis di QR Kan",
  icons: {
    icon: "/globe.svg",
    shortcut: "/globe.svg",
    apple: "/globe.svg",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://qrkan.com/explore",
    siteName: "QR Kan",
    title: "Explore | QR Kan",
    description: "Jelajahi profil digital menarik dari berbagai creator dan bisnis di QR Kan",
  },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category || null;
  // Always load first page for infinite scroll
  const itemsPerPage = 10;
  const offset = 0;
  
  // Skip auth check for faster page load - user profile is optional
  // Start main queries immediately (non-blocking for categories)
  const categoriesPromise = (async () => {
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
      return Array.from(allCategories).sort();
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
          return Array.from(allCategories).sort();
        } catch {
          return [];
        }
      }
      return [];
    }
  })();
  
  // Skip user profile check for faster load - it's optional UI element
  // Wait for categories (needed for filtering)
  const availableCategories = await categoriesPromise;
  // Create case-insensitive category map for comparison
  const categoryMap = new Map<string, string>();
  availableCategories.forEach(cat => {
    categoryMap.set(cat.toLowerCase(), cat); // Map lowercase to original case
  });
  const currentUserProfile = null; // Skip user profile to speed up page load

  // Infinite scroll - always show first page initially
  let hasNextPage = false;

  // Get all profiles that have at least one visible block
  // Exclude super admin users
  // Filter scheduled content (only show blocks that are currently active)
  let profilesWithContent: any[] = [];
  
  try {
    // Check if profiles.category column exists
    let categoryColumnExists = false;
    try {
      await db.select({ category: profiles.category }).from(profiles).limit(1);
      categoryColumnExists = true;
    } catch {
      // Column doesn't exist, will use profile_categories table
      categoryColumnExists = false;
    }
    
    // Optimized query: Use EXISTS subquery instead of JOIN to improve performance
    // First, get profile IDs that have visible blocks (using EXISTS for better performance)
    let profilesWithVisibleBlocks = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        userId: profiles.userId,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(
        and(
          or(
            eq(users.isSuperAdmin, false),
            isNull(users.isSuperAdmin)
          ),
          // Filter by category if column exists and category is selected (case-insensitive)
          // Support filtering by one category even if profile has multiple categories (comma-separated)
          ...(selectedCategory && selectedCategory !== "all" && categoryMap.has(selectedCategory.toLowerCase()) && categoryColumnExists
            ? [sql`LOWER(${profiles.category}) LIKE ${`%, ${selectedCategory.toLowerCase()},%`} OR LOWER(${profiles.category}) LIKE ${`${selectedCategory.toLowerCase()},%`} OR LOWER(${profiles.category}) LIKE ${`%, ${selectedCategory.toLowerCase()}`} OR LOWER(${profiles.category}) = ${selectedCategory.toLowerCase()}`]
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
    // If category doesn't exist in availableCategories (case-insensitive), return empty result
    if (selectedCategory && selectedCategory !== "all" && !categoryMap.has(selectedCategory.toLowerCase())) {
      // Category doesn't exist, return empty result
      profilesWithVisibleBlocks = [];
    } else if (selectedCategory && selectedCategory !== "all" && categoryMap.has(selectedCategory.toLowerCase()) && !categoryColumnExists) {
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
              return categories.includes(selectedCategory.toLowerCase().trim());
            })
            .map(pc => pc.profileId)
        );
        
        profilesWithVisibleBlocks = profilesWithVisibleBlocks.filter(p => filteredIds.has(p.id));
      } catch (categoryError: any) {
        // profile_categories table might not exist yet
        console.warn("Could not filter by category from profile_categories:", categoryError?.message);
      }
    }
    
    // Skip block counts query for faster load - we'll use a simpler approach
    // Just sort by profile ID for consistent ordering
    const blockCounts: { profileId: string; count: number }[] = [];
    
    // Check if there's a next page (we fetched one extra item)
    hasNextPage = profilesWithVisibleBlocks.length > itemsPerPage;
    
    // Only take the items for current page
    const profilesForPage = hasNextPage 
      ? profilesWithVisibleBlocks.slice(0, itemsPerPage)
      : profilesWithVisibleBlocks;
    
    // Combine results (simplified - no block count sorting for faster load)
    profilesWithContent = profilesForPage.map(p => ({
      profileId: p.id,
      username: p.username,
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      userId: p.userId,
      blockCount: 1, // Simplified - always show 1 for faster query
    }));
    
    // Try to add status, coverImageUrl, view count, and like count if columns exist
    if (profilesWithContent.length > 0) {
      try {
        const profileIds = profilesWithContent.map(p => p.profileId);
        
        // Fetch essential data (status/cover/category) and analytics (visits/clicks)
        let profilesWithStatus: any[] = [];
        let categoryMap = new Map<string, string | null>();
        
        // Fetch visit counts per profile
        const visitCounts = await db
          .select({
            profileId: visits.profileId,
            count: sql<number>`COUNT(*)::int`.as('count'),
          })
          .from(visits)
          .where(inArray(visits.profileId, profileIds))
          .groupBy(visits.profileId);
        
        // Fetch all blocks for these profiles to calculate click counts
        const profileBlocks = await db
          .select({ id: blocks.id, profileId: blocks.profileId })
          .from(blocks)
          .where(inArray(blocks.profileId, profileIds));
        
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
        const clickCounts: { profileId: string; count: number }[] = [];
        const blockIdToProfileId = new Map(profileBlocks.map(b => [b.id, b.profileId]));
        const profileClickCounts = new Map<string, number>();
        
        clickCountsByBlock.forEach(cc => {
          const profileId = blockIdToProfileId.get(cc.blockId);
          if (profileId) {
            const current = profileClickCounts.get(profileId) || 0;
            profileClickCounts.set(profileId, current + cc.count);
          }
        });
        
        profileClickCounts.forEach((count, profileId) => {
          clickCounts.push({ profileId, count });
        });
        
        try {
          // Only fetch status/cover/category - skip analytics for faster load
          try {
            profilesWithStatus = await db
              .select({
                id: profiles.id,
                status: profiles.status,
                statusType: profiles.statusType,
                coverImageUrl: profiles.coverImageUrl,
                category: profiles.category,
              })
              .from(profiles)
              .where(inArray(profiles.id, profileIds));
          } catch (error: any) {
            // If category column doesn't exist, try without it
            if (error?.message?.includes('category') || error?.code === '42703') {
              profilesWithStatus = await db
                .select({
                  id: profiles.id,
                  status: profiles.status,
                  statusType: profiles.statusType,
                  coverImageUrl: profiles.coverImageUrl,
                })
                .from(profiles)
                .where(inArray(profiles.id, profileIds));
            } else {
              throw error;
            }
          }
          
          // Create category map from profiles.category
          if (profilesWithStatus.length > 0 && 'category' in profilesWithStatus[0]) {
            categoryMap = new Map(profilesWithStatus.map((p: any) => [p.id, p.category ?? null]));
          } else {
            // Get categories from profile_categories table if needed
            try {
              const profileCategoriesData = await db
                .select({
                  profileId: profileCategories.profileId,
                  category: profileCategories.category,
                })
                .from(profileCategories)
                .where(inArray(profileCategories.profileId, profileIds));
              
              categoryMap = new Map(profileCategoriesData.map(p => [p.profileId, p.category]));
            } catch {
              // Silently fail
            }
          }
        } catch (categoryError: any) {
          // Fallback: try to get data separately
          try {
            profilesWithStatus = await db
              .select({
                id: profiles.id,
                status: profiles.status,
                statusType: profiles.statusType,
                coverImageUrl: profiles.coverImageUrl,
              })
              .from(profiles)
              .where(inArray(profiles.id, profileIds));
          } catch {
            // Silently fail
          }
        }
        
        // Create map for quick lookup
        const likesPerProfile = new Map(clickCounts.map((c: any) => [c.profileId, c.count]));
        
        // Merge all data
        const statusMap = new Map(profilesWithStatus.map((p: any) => [p.id, p]));
        const visitMap = new Map(visitCounts.map((v: any) => [v.profileId, v.count]));
        
        profilesWithContent = profilesWithContent.map(p => ({
          ...p,
          status: statusMap.get(p.profileId)?.status ?? null,
          statusType: statusMap.get(p.profileId)?.statusType ?? null,
          coverImageUrl: statusMap.get(p.profileId)?.coverImageUrl ?? null,
          category: categoryMap.get(p.profileId) ?? null,
          viewCount: visitMap.get(p.profileId) ?? 0,
          likeCount: likesPerProfile.get(p.profileId) ?? 0,
        }));
        
        // Filter by category if selected (as backup if not already filtered in main query)
        // Support filtering by one category even if profile has multiple categories (comma-separated)
        if (selectedCategory && selectedCategory !== "all" && categoryMap.has(selectedCategory.toLowerCase())) {
          profilesWithContent = profilesWithContent.filter(p => {
            if (!p.category) return false;
            // Split by comma and check if selectedCategory matches any of them (case-insensitive)
            const categories = p.category.split(',').map(c => c.trim().toLowerCase());
            return categories.includes(selectedCategory.toLowerCase().trim());
          });
        }
      } catch (statusError: any) {
        // If columns don't exist, just add null/zero values
        // But still try to get categories from profile_categories table for filtering
        let categoryMapFallback = new Map<string, string | null>();
        if (profilesWithContent.length > 0) {
          try {
            const profileIds = profilesWithContent.map(p => p.profileId);
            const profileCategoriesData = await db
              .select({
                profileId: profileCategories.profileId,
                category: profileCategories.category,
              })
              .from(profileCategories)
              .where(inArray(profileCategories.profileId, profileIds));
            
            categoryMapFallback = new Map(profileCategoriesData.map(p => [p.profileId, p.category]));
          } catch (categoryError: any) {
            // profile_categories table might not exist yet
            console.warn("Could not load categories from profile_categories:", categoryError?.message);
          }
        }
        
        profilesWithContent = profilesWithContent.map(p => ({
          ...p,
          status: null,
          statusType: null,
          coverImageUrl: null,
          category: categoryMapFallback.get(p.profileId) ?? null,
          viewCount: 0,
          likeCount: 0,
        }));
        
        // Filter by category if selected
        // Support filtering by one category even if profile has multiple categories (comma-separated)
        if (selectedCategory && selectedCategory !== "all" && categoryMap.has(selectedCategory.toLowerCase())) {
          profilesWithContent = profilesWithContent.filter(p => {
            if (!p.category) return false;
            // Split by comma and check if selectedCategory matches any of them (case-insensitive)
            const categories = p.category.split(',').map(c => c.trim().toLowerCase());
            return categories.includes(selectedCategory.toLowerCase().trim());
          });
        }
      }
    } else {
      // No profiles, ensure array structure
      profilesWithContent = profilesWithContent.map(p => ({
        ...p,
        status: null,
        statusType: null,
        coverImageUrl: null,
        viewCount: 0,
        likeCount: 0,
      }));
    }
  } catch (error: any) {
    // If isSuperAdmin or scheduled columns don't exist yet
    if (error?.message?.includes('is_super_admin') || error?.message?.includes('scheduled_from') || error?.message?.includes('scheduled_to') || error?.code === '42703') {
      // Query without status columns
      profilesWithContent = await db
        .select({
          profileId: profiles.id,
          username: profiles.username,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          userId: profiles.userId,
          blockCount: sql<number>`count(DISTINCT ${blocks.id})::int`,
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .innerJoin(blocks, eq(blocks.profileId, profiles.id))
        .where(eq(blocks.isVisible, true))
        .groupBy(profiles.id, profiles.username, profiles.displayName, profiles.bio, profiles.avatarUrl, profiles.userId)
        .having(sql`count(DISTINCT ${blocks.id}) > 0`)
        .orderBy(desc(sql`count(DISTINCT ${blocks.id})`));
      
      // Add null status, coverImageUrl, and zero counts for profiles without these columns
      profilesWithContent = profilesWithContent.map(p => ({
        ...p,
        status: null,
        statusType: null,
        coverImageUrl: null,
        viewCount: 0,
        likeCount: 0,
      }));
    } else {
      throw error;
    }
  }
  
  // Ensure status and coverImageUrl fields exist even if query didn't include them
  // Also ensure all required fields exist and are valid
  if (!Array.isArray(profilesWithContent)) {
    profilesWithContent = [];
  }
  
  profilesWithContent = profilesWithContent.map((p: any) => {
    if (!p || typeof p !== 'object') {
      return null;
    }
    const result = {
      profileId: p.profileId || p.id || '',
      username: p.username || '',
      displayName: p.displayName || p.username || '',
      bio: p.bio || null,
      avatarUrl: p.avatarUrl || null,
      userId: p.userId || null,
      status: p.status ?? null,
      statusType: p.statusType ?? null,
      coverImageUrl: p.coverImageUrl ?? null,
      blockCount: typeof p.blockCount === 'number' ? p.blockCount : 0,
      viewCount: typeof p.viewCount === 'number' ? p.viewCount : 0,
      likeCount: typeof p.likeCount === 'number' ? p.likeCount : 0,
    };
    return result;
  }).filter((p: any) => p !== null && p && p.profileId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition">
              <Image
                src="/default-logo.svg"
                alt="QR Kan"
                width={24}
                height={24}
                className="h-5 w-5 sm:h-6 sm:w-6"
              />
              <span className="text-lg sm:text-2xl font-bold text-zinc-900">QR Kan</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* User profile link removed for faster page load */}
              <Link
                href="/"
                className="text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 transition px-2 sm:px-0"
              >
                ← Kembali
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Category Filter - Hidden */}
        {/* {availableCategories.length > 0 && (
          <div className="mb-4 sm:mb-6 px-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-zinc-700">Filter Kategori:</span>
              <Link
                href="/explore"
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                  !selectedCategory || selectedCategory === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Semua
              </Link>
              {availableCategories.map((category) => (
                <Link
                  key={category}
                  href={`/explore?category=${encodeURIComponent(category)}`}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                    selectedCategory === category
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        )} */}
        
        {profilesWithContent.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm sm:text-base text-zinc-500">
              {selectedCategory && selectedCategory !== "all" && !categoryMap.has(selectedCategory.toLowerCase())
                ? `Kategori "${selectedCategory}" tidak ditemukan`
                : selectedCategory && selectedCategory !== "all"
                ? `Tidak ada profil dengan kategori "${selectedCategory}"`
                : "Belum ada profil yang dipublikasikan"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 sm:mb-6 px-1">
              <p className="text-xs sm:text-sm text-zinc-600">
                Menampilkan profil dengan konten
              </p>
            </div>
            {/* Infinite Scroll Grid Layout */}
            <InfiniteScrollExplore
              initialProfiles={profilesWithContent}
              category={selectedCategory}
            />
          </>
        )}
      </main>

      {/* Powered by QR Kan */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
        <div className="rounded-lg bg-white/80 backdrop-blur-sm px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs text-zinc-600 shadow-sm border border-zinc-200">
          Powered by <span className="font-semibold text-emerald-600">QR Kan</span>
        </div>
      </div>
    </div>
  );
}


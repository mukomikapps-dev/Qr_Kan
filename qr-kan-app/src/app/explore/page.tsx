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
  console.log(`[EXPLORE PAGE] Requested category: "${selectedCategory}"`);
  console.log(`[EXPLORE PAGE] params:`, params);
  
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
        status: profiles.status,
        statusType: profiles.statusType,
        coverImageUrl: profiles.coverImageUrl,
        category: profileCategories.category,
      })
      .from(profiles)
      .leftJoin(profileCategories, eq(profiles.id, profileCategories.profileId))
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
    
    // Filter by category in JavaScript to handle both JSON array and string formats
    if (selectedCategory && selectedCategory !== "all") {
      const beforeFilterCount = profilesWithVisibleBlocks.length;
      const categoryLower = selectedCategory.toLowerCase().trim();
      
      console.log(`[EXPLORE PAGE] INITIAL: Filtering by category="${selectedCategory}" (lower="${categoryLower}")`);
      console.log(`[EXPLORE PAGE] INITIAL: Total profiles before filter: ${beforeFilterCount}`);
      console.log(`[EXPLORE PAGE] INITIAL: Sample profiles:`, profilesWithVisibleBlocks.slice(0, 3).map(p => ({
        username: p.username,
        category: p.category,
      })));
      
      profilesWithVisibleBlocks = profilesWithVisibleBlocks.filter(profile => {
        const usernameLower = profile.username?.toLowerCase().trim() || '';
        
        // First try matching by username (for profile-specific category filters)
        if (usernameLower === categoryLower) {
          console.log(`[EXPLORE PAGE] INITIAL: MATCH username "${profile.username}" === "${categoryLower}"`);
          return true;
        }
        
        // Then try matching by category field
        if (!profile.category) {
          console.log(`[EXPLORE PAGE] INITIAL: NO CATEGORY for ${profile.username}`);
          return false;
        }
        
        let categories: string[] = [];
        try {
          // Try parsing as JSON array first
          const parsed = JSON.parse(profile.category);
          if (Array.isArray(parsed)) {
            categories = parsed.map((c: any) => String(c).trim().toLowerCase());
          } else if (typeof parsed === 'string') {
            categories = [parsed.trim().toLowerCase()];
          } else {
            categories = [String(parsed).trim().toLowerCase()];
          }
        } catch {
          // Not JSON, treat as comma-separated string or plain string
          categories = profile.category.split(',').map(c => c.trim().toLowerCase());
        }
        
        const isIncluded = categories.includes(categoryLower);
        if (profile.username === 'floatingmarket') {
          console.log(`[EXPLORE PAGE] INITIAL: floatingmarket - categories:`, categories, `includes "${categoryLower}":`, isIncluded);
        }
        return isIncluded;
      });
      
      console.log(`[EXPLORE PAGE] INITIAL: Total profiles after filter: ${profilesWithVisibleBlocks.length}`);
    }
    
    // Slice for pagination after filtering
    const offset = 0;
    let paginatedProfiles = profilesWithVisibleBlocks.slice(offset, offset + itemsPerPage + 1);
    
    // Check if there's a next page (we fetched one extra item)
    hasNextPage = paginatedProfiles.length > itemsPerPage;
    
    // Only take the items for current page
    const profilesForPage = hasNextPage 
      ? paginatedProfiles.slice(0, itemsPerPage)
      : paginatedProfiles;
    
    // Combine results (simplified - no block count sorting for faster load)
    profilesWithContent = profilesForPage.map(p => ({
      profileId: p.id,
      username: p.username,
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      userId: p.userId,
      status: p.status ?? null,
      statusType: p.statusType ?? null,
      coverImageUrl: p.coverImageUrl ?? null,
      category: p.category ?? null,
      blockCount: 1, // Simplified - always show 1 for faster query
    }));
    
    // Try to add status, coverImageUrl, view count, and like count if columns exist
    if (profilesWithContent.length > 0) {
      try {
        const profileIds = profilesWithContent.map(p => p.profileId);
        
        // Fetch analytics data (visits/clicks) only
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
        
        // Fetch status and cover image data
        const profilesWithStatus = await db
          .select({
            id: profiles.id,
            status: profiles.status,
            statusType: profiles.statusType,
            coverImageUrl: profiles.coverImageUrl,
          })
          .from(profiles)
          .where(inArray(profiles.id, profileIds));
        
        // Create map for quick lookup
        const likesPerProfile = new Map(clickCounts.map((c: any) => [c.profileId, c.count]));
        const statusMap = new Map(profilesWithStatus.map((p: any) => [p.id, p]));
        const visitMap = new Map(visitCounts.map((v: any) => [v.profileId, v.count]));
        
        profilesWithContent = profilesWithContent.map(p => ({
          ...p,
          status: statusMap.get(p.profileId)?.status ?? p.status ?? null,
          statusType: statusMap.get(p.profileId)?.statusType ?? p.statusType ?? null,
          coverImageUrl: statusMap.get(p.profileId)?.coverImageUrl ?? p.coverImageUrl ?? null,
          category: p.category ?? null,
          viewCount: visitMap.get(p.profileId) ?? 0,
          likeCount: likesPerProfile.get(p.profileId) ?? 0,
        }));
        
        // Filter by category if selected (as backup if not already filtered in main query)
        // Support filtering by one category even if profile has multiple categories (comma-separated)
        if (selectedCategory && selectedCategory !== "all") {
          profilesWithContent = profilesWithContent.filter(p => {
            const categoryLower = selectedCategory.toLowerCase().trim();
            const usernameLower = p.username?.toLowerCase().trim() || '';
            
            // Try username match first
            if (usernameLower === categoryLower) {
              return true;
            }
            
            // Then try category match
            if (!p.category) return false;
            const categories = p.category.split(',').map(c => c.trim().toLowerCase());
            return categories.includes(categoryLower);
          });
        }
      } catch (statusError: any) {
        // If columns don't exist, just add null/zero values
        profilesWithContent = profilesWithContent.map(p => ({
          ...p,
          status: p.status ?? null,
          statusType: p.statusType ?? null,
          coverImageUrl: p.coverImageUrl ?? null,
          category: p.category ?? null,
          viewCount: 0,
          likeCount: 0,
        }));
        
        // Filter by category if selected
        // Support filtering by one category even if profile has multiple categories (comma-separated)
        if (selectedCategory && selectedCategory !== "all") {
          profilesWithContent = profilesWithContent.filter(p => {
            const categoryLower = selectedCategory.toLowerCase().trim();
            const usernameLower = p.username?.toLowerCase().trim() || '';
            
            // Try username match first
            if (usernameLower === categoryLower) {
              return true;
            }
            
            // Then try category match
            if (!p.category) return false;
            const categories = p.category.split(',').map(c => c.trim().toLowerCase());
            return categories.includes(categoryLower);
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
          coverImageUrl: profiles.coverImageUrl,
          blockCount: sql<number>`count(DISTINCT ${blocks.id})::int`,
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .innerJoin(blocks, eq(blocks.profileId, profiles.id))
        .where(eq(blocks.isVisible, true))
        .groupBy(profiles.id, profiles.username, profiles.displayName, profiles.bio, profiles.avatarUrl, profiles.userId, profiles.coverImageUrl)
        .having(sql`count(DISTINCT ${blocks.id}) > 0`)
        .orderBy(desc(sql`count(DISTINCT ${blocks.id})`));
      
      // Add null status and zero counts for profiles without these columns
      profilesWithContent = profilesWithContent.map(p => ({
        ...p,
        status: null,
        statusType: null,
        viewCount: 0,
        likeCount: 0,
      }));
      
      // Filter by category if selected (fallback query version)
      if (selectedCategory && selectedCategory !== "all") {
        profilesWithContent = profilesWithContent.filter(p => {
          const categoryLower = selectedCategory.toLowerCase().trim();
          const usernameLower = p.username?.toLowerCase().trim() || '';
          
          // Try username match first
          if (usernameLower === categoryLower) {
            return true;
          }
          
          // For fallback query, we don't have category field, so only username match works
          return false; // No category filtering available in fallback query
        });
      }
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

  console.log('[EXPLORE PAGE FINAL] First 3 profiles to render:', profilesWithContent.slice(0, 3).map(p => ({
    username: p.username,
    coverImageUrl: p.coverImageUrl,
  })));

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


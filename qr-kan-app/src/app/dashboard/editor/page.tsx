import { db } from "@/db/client";
import { profiles, blocks, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import LogoutButton from "@/components/LogoutButton";
import EditorTabsClient from "./EditorTabsClient";
import Link from "next/link";
import { getOrCreateUser } from "@/lib/user-helpers";
import postgres from "postgres";

export default async function EditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user metadata
  const username = user.user_metadata?.username as string;
  const displayName = user.user_metadata?.display_name as string || username;

  // Get or create user in database
  const dbUser = await getOrCreateUser(user.id, user.email!);
  
  // Get isPro status (with fallback for migration)
  const isPro = dbUser?.isPro ?? false;

  // Check if profile exists (with fallback for status columns)
  let profile: any;
  try {
    profile = (await db.select().from(profiles).where(eq(profiles.userId, user.id)))[0];
  } catch (error: any) {
    // If status columns don't exist yet, select without them
    if (error?.message?.includes('status') || error?.code === '42703') {
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
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.userId, user.id)))[0];
      if (profile) {
        profile = {
          ...profile,
          status: null,
          statusType: null,
          coverImageUrl: null,
        };
      }
    } else {
      throw error;
    }
  }
  
  // Create profile if doesn't exist
  if (!profile) {
    const profileId = randomBytes(16).toString('hex');
    const profileUsername = username || user.email!.split('@')[0];
    const profileDisplayName = displayName || profileUsername;
    
    // Use raw SQL to insert only basic columns that definitely exist
    const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
      throw new Error("POSTGRES_URL not configured");
    }
    const sql = postgres(connectionString, { prepare: false });
    try {
      await sql`
        INSERT INTO profiles (id, user_id, username, display_name, bio, avatar_url)
        VALUES (${profileId}, ${user.id}, ${profileUsername}, ${profileDisplayName}, NULL, NULL)
      `;
    } finally {
      await sql.end();
    }
    
    // Fetch the newly created profile
    try {
      profile = (await db.select().from(profiles).where(eq(profiles.userId, user.id)))[0];
    } catch (error: any) {
      if (error?.message?.includes('status') || error?.code === '42703') {
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
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .where(eq(profiles.userId, user.id)))[0];
        if (profile) {
          profile = {
            ...profile,
            status: null,
            statusType: null,
            coverImageUrl: null,
          };
        }
      } else {
        throw error;
      }
    }
  }
  
  // Ensure status and coverImageUrl fields exist
  profile = {
    ...profile,
    status: profile.status ?? null,
    statusType: profile.statusType ?? null,
    coverImageUrl: profile.coverImageUrl ?? null,
  };

  if (!profile) return <div className="p-6">Error: Unable to create profile.</div>;
  
  // Try to select with scheduled columns, fallback to basic columns if they don't exist
  let list: any[];
  try {
    list = await db
      .select()
      .from(blocks)
      .where(eq(blocks.profileId, profile.id))
      .then((rows: any[]) => rows.sort((a: any, b: any) => a.order - b.order));
  } catch (error: any) {
    // If scheduled columns don't exist yet, select only basic columns
    if (error?.message?.includes('scheduled_from') || error?.message?.includes('scheduled_to')) {
      list = await db
        .select({
          id: blocks.id,
          profileId: blocks.profileId,
          type: blocks.type,
          dataJson: blocks.dataJson,
          order: blocks.order,
          isVisible: blocks.isVisible,
          createdAt: blocks.createdAt,
        })
        .from(blocks)
        .where(eq(blocks.profileId, profile.id))
        .then((rows: any[]) => {
          // Add null for scheduled and category columns
          return rows.map((row: any) => ({
            ...row,
            scheduledFrom: null,
            scheduledTo: null,
            category: null,
          })).sort((a: any, b: any) => a.order - b.order);
        });
    } else {
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden shadow-md">
                  <img 
                    src="/default-logo.svg" 
                    alt="QR Kan Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">Editor</h1>
                  <div className="mt-0.5 text-sm font-medium text-emerald-600">@{profile.username}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
              <LogoutButton className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm" />
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
          <EditorTabsClient
            username={profile.username}
            profileId={profile.id}
            blocks={list.map((b: any) => ({
              id: b.id,
              type: b.type,
              dataJson: b.dataJson,
              order: b.order,
              isVisible: b.isVisible,
              scheduledFrom: b.scheduledFrom || null,
              scheduledTo: b.scheduledTo || null,
              category: b.category || null,
            }))}
            isPro={isPro}
          />
        </div>
      </div>
      
      {/* Branding Footer */}
      <div className="fixed bottom-4 right-4 z-40">
        <a
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors shadow-sm"
          title="QR Kan - Digital Profile Builder"
        >
          <span>Powered by</span>
          <span className="font-semibold text-emerald-600">QR Kan</span>
        </a>
      </div>
    </div>
  );
}


import { db } from "@/db/client";
import { blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import LogoutButton from "@/components/LogoutButton";
import DashboardHeader from "@/components/DashboardHeader";
import EditorTabsClient from "./EditorTabsClient";
import { getOrCreateUser } from "@/lib/user-helpers";
import { fetchUserProfiles, resolveActiveProfile } from "@/lib/profile-utils";
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

  // Fetch all profiles (handles missing columns) dan resolve profil aktif
  let profileList: any[] = await fetchUserProfiles(user.id);

  // Buat profil pertama jika belum ada
  if (profileList.length === 0) {
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
    profileList = await fetchUserProfiles(user.id);
  }

  // Ensure status and coverImageUrl fields exist
  const activeProfile = resolveActiveProfile(profileList, dbUser?.activeProfileId ?? null);
  let profile: any = activeProfile;

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
        <DashboardHeader
          title="Editor"
          username={profile.username}
          profileList={profileList.map((p: any) => ({ id: p.id, username: p.username, displayName: p.displayName }))}
          activeProfileId={dbUser?.activeProfileId ?? null}
          logout={<LogoutButton className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm" />}
        />
        
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


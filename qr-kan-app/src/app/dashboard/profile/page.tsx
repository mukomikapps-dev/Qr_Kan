import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import LogoutButton from "@/components/LogoutButton";
import DashboardHeader from "@/components/DashboardHeader";
import ProfileFormClient from "./ProfileFormClient";
import { getOrCreateUser } from "@/lib/user-helpers";
import { fetchUserProfiles, resolveActiveProfile } from "@/lib/profile-utils";
import postgres from "postgres";

export default async function ProfilePage() {
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

  const activeProfile = resolveActiveProfile(profileList, dbUser?.activeProfileId ?? null);
  let profile: any = activeProfile;

  if (!profile) return <div className="p-6">Error: Unable to create profile.</div>;

  // Ensure status, coverImageUrl, dan category fields exist
  profile = {
    ...profile,
    status: profile.status ?? null,
    statusType: profile.statusType ?? null,
    coverImageUrl: profile.coverImageUrl ?? null,
    category: profile.category ?? null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 relative">
        {/* Header Section with Navigation */}
        <DashboardHeader
          title="Profile"
          username={profile.username}
          profileList={profileList.map((p: any) => ({ id: p.id, username: p.username, displayName: p.displayName }))}
          activeProfileId={dbUser?.activeProfileId ?? null}
          logout={<LogoutButton className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm" />}
        />
        {/* Profile Header Banner */}
        <div className="relative h-48 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 mt-6">
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-20 overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
                backgroundSize: "40px 40px"
              }}
            />
          </div>
        </div>
        
        {/* Profile Picture - Outside banner container */}
        <div className="absolute top-[calc(6rem+12rem)] left-1/2 transform -translate-x-1/2 z-[100]">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              <img 
                src={profile.avatarUrl || "/default-avatar.svg"} 
                alt={profile.displayName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-emerald-600 border-4 border-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-700 transition z-[101]">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="mt-20 px-6 pb-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">{profile.displayName}</h1>
            <p className="text-zinc-500 mb-1">@{profile.username}</p>
            {profile.bio && (
              <p className="text-zinc-600 mt-3 max-w-2xl mx-auto italic">"{profile.bio}"</p>
            )}
            <a 
              href={`/@${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Lihat Halaman Publik
            </a>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="px-6 pb-8">
          <ProfileFormClient profile={{
            ...profile,
            status: (profile as any).status || null,
            statusType: (profile as any).statusType || null,
            coverImageUrl: (profile as any).coverImageUrl || null,
            category: (profile as any).category || null,
          }} />
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


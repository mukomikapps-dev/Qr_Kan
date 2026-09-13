import { db } from "@/db/client";
import { blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addLinkBlock, addSocialBlock, addTextBlock } from "./actions";
import DashboardTabsClient from "./DashboardTabsClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import LogoutButton from "@/components/LogoutButton";
import SubscriptionButton from "@/components/SubscriptionButton";
import DashboardHeader from "@/components/DashboardHeader";
import { getOrCreateUser } from "@/lib/user-helpers";
import { fetchUserProfiles, resolveActiveProfile } from "@/lib/profile-utils";
import postgres from "postgres";

export default async function DashboardPage() {
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
  
  // Ensure status and coverImageUrl fields exist
  profile = {
    ...profile,
    status: profile.status ?? null,
    statusType: profile.statusType ?? null,
    coverImageUrl: profile.coverImageUrl ?? null,
  };
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
          title="Dashboard"
          subtitle="Kelola halaman profil Anda"
          username={profile.username}
          profileList={profileList.map((p: any) => ({ id: p.id, username: p.username, displayName: p.displayName }))}
          activeProfileId={dbUser?.activeProfileId ?? null}
          logout={
            <>
              <SubscriptionButton />
              <LogoutButton className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm" />
            </>
          }
        />

        {/* All Pages Section */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-lg font-bold text-zinc-900">Semua Halaman</h2>
            <a
              href="/dashboard/pages"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Kelola
            </a>
          </div>
          <div className="p-5 pt-3">
            {profileList.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada halaman.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profileList.map((p: any) => {
                  const isActive = p.id === profile.id;
                  return (
                    <a
                      key={p.id}
                      href={`/@${p.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                        <img
                          src={p.avatarUrl || "/default-avatar.svg"}
                          alt={p.displayName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-zinc-900">{p.displayName}</span>
                          {isActive && (
                            <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="truncate text-sm text-zinc-500">@{p.username}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <DashboardTabsClient
            username={profile.username}
            profile={{
              id: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              bio: profile.bio,
              avatarUrl: profile.avatarUrl,
              logoUrl: (profile as any).logoUrl,
              bgType: (profile as any).bgType,
              bgSolidColor: (profile as any).bgSolidColor,
              bgImageUrl: (profile as any).bgImageUrl,
              bgPatternId: (profile as any).bgPatternId,
              bgGradientColors: (profile as any).bgGradientColors,
              showAvatar: (profile as any).showAvatar,
              showDisplayName: (profile as any).showDisplayName,
              showBio: (profile as any).showBio,
              showLogo: (profile as any).showLogo,
              showQr: (profile as any).showQr,
              showIcons: (profile as any).showIcons,
              stickyHeaderBg: (profile as any).stickyHeaderBg,
              themePresetId: (profile as any).themePresetId,
              useCustomColors: (profile as any).useCustomColors,
              customColors: (profile as any).customColors,
              detailedColors: (profile as any).detailedColors,
            }}
            blocks={list.map((b: any) => ({
              id: b.id,
              type: b.type,
              dataJson: b.dataJson,
              order: b.order,
              isVisible: b.isVisible,
            }))}
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

// AddGenericForm moved to client component for conditional field visibility

function AddLinkForm({ username }: { username: string }) {
  return (
    <form
      action={async (formData) => {
        "use server";
        const title = String(formData.get("title") ?? "");
        const url = String(formData.get("url") ?? "");
        if (title && url) {
          await addLinkBlock(username, title, url);
        }
      }}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4"
    >
      <div className="font-medium">Tambah Link</div>
      <input
        name="title"
        placeholder="Judul"
        className="rounded border border-zinc-300 px-3 py-2"
        required
      />
      <input
        name="url"
        placeholder="https://..."
        className="rounded border border-zinc-300 px-3 py-2"
        required
      />
      <button className="rounded bg-black px-4 py-2 text-white">Tambah</button>
    </form>
  );
}

function AddTextForm({ username }: { username: string }) {
  return (
    <form
      action={async (formData) => {
        "use server";
        const text = String(formData.get("text") ?? "");
        if (text) {
          await addTextBlock(username, text);
        }
      }}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4"
    >
      <div className="font-medium">Tambah Text</div>
      <textarea
        name="text"
        placeholder="Isi teks..."
        className="rounded border border-zinc-300 px-3 py-2"
        rows={3}
        required
      />
      <button className="rounded bg-black px-4 py-2 text-white">Tambah</button>
    </form>
  );
}

function AddSocialForm({ username }: { username: string }) {
  return (
    <form
      action={async (formData) => {
        "use server";
        const platform = String(formData.get("platform") ?? "");
        const handle = String(formData.get("handle") ?? "");
        if (platform && handle) {
          await addSocialBlock(username, platform, handle);
        }
      }}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4"
    >
      <div className="font-medium">Tambah Social</div>
      <input
        name="platform"
        placeholder="instagram | tiktok | ..."
        className="rounded border border-zinc-300 px-3 py-2"
        required
      />
      <input
        name="handle"
        placeholder="username"
        className="rounded border border-zinc-300 px-3 py-2"
        required
      />
      <button className="rounded bg-black px-4 py-2 text-white">Tambah</button>
    </form>
  );
}

function BlockEditor({ type, data }: { type: string; data: any }) {
  if (type === "link") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="title"
          defaultValue={data.title ?? ""}
          placeholder="Judul"
          className="w-40 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="url"
          defaultValue={data.url ?? ""}
          placeholder="https://..."
          className="w-56 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          name="action"
          value="update-link"
          className="rounded border px-3 py-1 text-sm text-blue-600"
        >
          Simpan
        </button>
      </div>
    );
  }
  if (type === "text") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="text"
          defaultValue={data.text ?? ""}
          placeholder="Teks..."
          className="w-80 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          name="action"
          value="update-text"
          className="rounded border px-3 py-1 text-sm text-blue-600"
        >
          Simpan
        </button>
      </div>
    );
  }
  if (type === "social") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="platform"
          defaultValue={data.platform ?? ""}
          placeholder="instagram | tiktok | ..."
          className="w-40 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="handle"
          defaultValue={data.handle ?? ""}
          placeholder="@handle"
          className="w-56 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          name="action"
          value="update-social"
          className="rounded border px-3 py-1 text-sm text-blue-600"
        >
          Simpan
        </button>
      </div>
    );
  }
  if (type === "image") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="imageUrl"
          defaultValue={data.imageUrl ?? ""}
          placeholder="https://gambar.jpg"
          className="w-72 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="alt"
          defaultValue={data.alt ?? ""}
          placeholder="deskripsi"
          className="w-48 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
    );
  }
  if (type === "video") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="videoUrl"
          defaultValue={data.videoUrl ?? ""}
          placeholder="https://video.mp4 atau youtube"
          className="w-72 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="posterUrl"
          defaultValue={data.posterUrl ?? ""}
          placeholder="Poster optional"
          className="w-48 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
    );
  }
  if (type === "svg") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="svgUrl"
          defaultValue={data.svgUrl ?? ""}
          placeholder="https://file.svg"
          className="w-96 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
    );
  }
  if (type === "whatsapp" || type === "marketplace") {
    return (
      <div className="flex items-center gap-3">
        <input
          name="platform"
          defaultValue={data.platform ?? ""}
          placeholder={type === "whatsapp" ? "whatsapp" : "tokopedia/shopee/..."}
          className="w-40 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        {type === "whatsapp" ? (
          <>
            <input
              name="phone"
              defaultValue={data.phone ?? ""}
              placeholder="628xxx"
              className="w-40 rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="message"
              defaultValue={data.message ?? ""}
              placeholder="Pesan"
              className="w-56 rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </>
        ) : (
          <input
            name="url"
            defaultValue={data.url ?? ""}
            placeholder="https://produk..."
            className="w-72 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="font-medium">{type}</div>
      <div className="text-xs text-zinc-500">Tidak ada editor untuk tipe ini</div>
    </div>
  );
}



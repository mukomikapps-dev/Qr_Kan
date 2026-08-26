import { db } from "@/db/client";
import { profiles, profileCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserProfile = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  logoUrl: string | null;
  bgType: string | null;
  bgSolidColor: string | null;
  bgImageUrl: string | null;
  bgPatternId: string | null;
  bgGradientColors: string | null;
  showAvatar: boolean | null;
  showDisplayName: boolean | null;
  showBio: boolean | null;
  showLogo: boolean | null;
  showQr: boolean | null;
  showIcons: boolean | null;
  stickyHeaderBg: boolean | null;
  themePresetId: string | null;
  themeJson: string | null;
  useCustomColors: boolean | null;
  customColors: string | null;
  detailedColors: string | null;
  status: string | null;
  statusType: string | null;
  coverImageUrl: string | null;
  category: string | null;
  createdAt: Date;
};

const BASIC_PROFILES_SELECT = {
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
};

/**
 * Mengambil SEMUA profil milik user. Menangani kolom yang mungkin belum ada
 * (status, statusType, coverImageUrl) serta mengambil category dari tabel mapping.
 */
export async function fetchUserProfiles(userId: string): Promise<UserProfile[]> {
  type ProfileRow = {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    createdAt: Date;
  } & Partial<Omit<UserProfile, "userId" | "username" | "displayName" | "createdAt">>;

  let rows: ProfileRow[];
  try {
    rows = (await db.select().from(profiles).where(eq(profiles.userId, userId))) as ProfileRow[];
  } catch (error) {
    const e = error as { message?: string; code?: string };
    if (e?.message?.includes("status") || e?.code === "42703") {
      rows = (await db
        .select(BASIC_PROFILES_SELECT)
        .from(profiles)
        .where(eq(profiles.userId, userId))) as ProfileRow[];
      rows = rows.map((p) => ({
        ...p,
        status: null,
        statusType: null,
        coverImageUrl: null,
      })) as ProfileRow[];
    } else {
      throw error;
    }
  }

  // Normalisasi + ambil category per profil
  const result: UserProfile[] = [];
  for (const p of rows) {
    let category: string | null = null;
    try {
      const catData = await db
        .select({ category: profileCategories.category })
        .from(profileCategories)
        .where(eq(profileCategories.profileId, p.id))
        .limit(1);
      category = catData[0]?.category ?? null;
    } catch {
      // Tabel profile_categories belum ada -> abaikan
    }
    result.push({
      ...p,
      status: p.status ?? null,
      statusType: p.statusType ?? null,
      coverImageUrl: p.coverImageUrl ?? null,
      category,
      createdAt: p.createdAt,
    } as UserProfile);
  }
  return result;
}

/**
 * Menentukan profil "aktif" berdasarkan active_profile_id user.
 * Jika tidak/kosong, jatuh ke profil pertama. Dijamin tidak null jika list tidak kosong.
 */
export function resolveActiveProfile<T extends { id: string }>(
  profilesList: T[],
  activeProfileId?: string | null
): T | null {
  if (!profilesList.length) return null;
  return profilesList.find((p) => p.id === activeProfileId) ?? profilesList[0];
}
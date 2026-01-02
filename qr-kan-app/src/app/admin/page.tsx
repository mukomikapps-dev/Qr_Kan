import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import AdminDashboardClient from "./AdminDashboardClient";
import { db } from "@/db/client";
import { users, profiles, blocks, visits, clicks } from "@/db/schema";
import { sql, desc, count } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  // Get platform statistics (with fallback for isSuperAdmin column)
  let recentUsers: any[];
  try {
    recentUsers = await db
      .select({
        id: users.id,
        email: users.email,
        isPro: users.isPro,
        isSuperAdmin: users.isSuperAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);
  } catch (error: any) {
    // If isSuperAdmin column doesn't exist yet, select without it
    if (error?.message?.includes('is_super_admin')) {
      recentUsers = await db
        .select({
          id: users.id,
          email: users.email,
          isPro: users.isPro,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(10);
      // Add isSuperAdmin = false for all users
      recentUsers = recentUsers.map(u => ({ ...u, isSuperAdmin: false }));
    } else {
      throw error;
    }
  }

  // Use optimized parallel COUNT queries for better performance
  // All queries run in parallel using Promise.all
  const [
    totalUsers,
    totalProfiles,
    totalBlocks,
    totalVisits,
    totalClicks,
    proUsers,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(profiles),
    db.select({ count: count() }).from(blocks),
    db.select({ count: count() }).from(visits),
    db.select({ count: count() }).from(clicks),
    db.select({ count: count() }).from(users).where(sql`is_pro = true`),
  ]);

  const stats = {
    totalUsers: totalUsers[0]?.count ?? 0,
    totalProfiles: totalProfiles[0]?.count ?? 0,
    totalBlocks: totalBlocks[0]?.count ?? 0,
    totalVisits: totalVisits[0]?.count ?? 0,
    totalClicks: totalClicks[0]?.count ?? 0,
    proUsers: proUsers[0]?.count ?? 0,
    freeUsers: (totalUsers[0]?.count ?? 0) - (proUsers[0]?.count ?? 0),
  };

  return (
    <AdminDashboardClient
      adminUser={adminUser}
      stats={stats}
      recentUsers={recentUsers.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        isPro: u.isPro ?? false,
        isSuperAdmin: u.isSuperAdmin ?? false,
        createdAt: u.createdAt?.toISOString() ?? "",
      }))}
    />
  );
}


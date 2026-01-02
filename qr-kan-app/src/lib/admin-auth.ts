import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current user is a super admin (with fallback for migration)
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    try {
      const dbUser = await db
        .select({ isSuperAdmin: users.isSuperAdmin })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      return dbUser[0]?.isSuperAdmin ?? false;
    } catch (error: any) {
      // If isSuperAdmin column doesn't exist yet, return false
      if (error?.message?.includes('is_super_admin')) {
        return false;
      }
      throw error;
    }
  } catch {
    return false;
  }
}

/**
 * Check if a specific user ID is a super admin (with fallback for migration)
 * Optimized with direct SQL query for faster execution
 */
export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  try {
    // Use optimized Drizzle query with sql template for better performance
    const result = await db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return result[0]?.isSuperAdmin === true;
  } catch (error: any) {
    // If isSuperAdmin column doesn't exist yet, return false
    if (error?.message?.includes('is_super_admin') || error?.code === '42703') {
      return false;
    }
    return false;
  }
}

/**
 * Get current user with admin status (with fallback for migration)
 * Optimized: Single query with fast check
 */
export async function getCurrentAdminUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Optimized: Single query with direct SQL for faster execution
    try {
      const dbUser = await db
        .select({
          id: users.id,
          email: users.email,
          isPro: users.isPro,
          isSuperAdmin: users.isSuperAdmin,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      // Early return if no user or not admin
      if (dbUser.length === 0 || !dbUser[0]?.isSuperAdmin) {
        return null;
      }

      return {
        id: dbUser[0].id,
        email: dbUser[0].email,
        isPro: dbUser[0].isPro,
        isSuperAdmin: dbUser[0].isSuperAdmin,
      };
    } catch (error: any) {
      // If isSuperAdmin column doesn't exist yet, return null
      if (error?.message?.includes('is_super_admin') || error?.code === '42703') {
        return null;
      }
      throw error;
    }
  } catch {
    return null;
  }
}


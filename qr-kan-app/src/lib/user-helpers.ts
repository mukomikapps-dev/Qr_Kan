import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Helper function to fetch or create a user in the database
 * Handles duplicate key errors and missing isSuperAdmin column gracefully
 */
export async function getOrCreateUser(userId: string, userEmail: string) {
  // Helper function to fetch user from database
  const fetchUser = async (useIsSuperAdmin: boolean = true) => {
    try {
      if (useIsSuperAdmin) {
        const result = await db
          .select({
            id: users.id,
            email: users.email,
            isPro: users.isPro,
            isSuperAdmin: users.isSuperAdmin || false,
            activeProfileId: users.activeProfileId,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        return result[0] || null;
      } else {
        const result = await db
          .select({
            id: users.id,
            email: users.email,
            isPro: users.isPro,
            activeProfileId: users.activeProfileId,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        const found = result[0];
        if (found) {
          return { ...found, isSuperAdmin: false };
        }
        return null;
      }
    } catch (error: any) {
      if (error?.message?.includes('is_super_admin') && useIsSuperAdmin) {
        return await fetchUser(false);
      }
      throw error;
    }
  };

  // Check if user exists in database (try by ID first)
  let dbUser = await fetchUser();
  
  // If not found, try by email as fallback
  if (!dbUser) {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          isPro: users.isPro,
          isSuperAdmin: users.isSuperAdmin || false,
          activeProfileId: users.activeProfileId,
        })
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);
      dbUser = result[0] || null;
    } catch (error: any) {
      if (error?.message?.includes('is_super_admin')) {
        const result = await db
          .select({
            id: users.id,
            email: users.email,
            isPro: users.isPro,
            activeProfileId: users.activeProfileId,
          })
          .from(users)
          .where(eq(users.email, userEmail))
          .limit(1);
        const found = result[0];
        if (found) {
          dbUser = { ...found, isSuperAdmin: false };
        }
      }
    }
  }
  
  // Create user if doesn't exist
  if (!dbUser) {
    try {
      // Try with isSuperAdmin first
      await db.insert(users).values({
        id: userId,
        email: userEmail,
        isPro: false,
        isSuperAdmin: false,
      });
    } catch (error: any) {
      // Handle duplicate key error - user already exists (race condition)
      if (error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('already exists')) {
        // User already exists, will fetch below
      } else if (error?.message?.includes('is_super_admin')) {
        // If isSuperAdmin column doesn't exist, insert without it
        try {
          await db.insert(users).values({
            id: userId,
            email: userEmail,
            isPro: false,
          });
        } catch (insertError: any) {
          // Handle duplicate key error even without isSuperAdmin
          if (insertError?.code === '23505' || insertError?.message?.includes('duplicate key') || insertError?.message?.includes('already exists')) {
            // User already exists, will fetch below
          } else {
            throw insertError;
          }
        }
      } else {
        throw error;
      }
    }
    
    // Fetch user after insert attempt (whether it succeeded or failed with duplicate key)
    dbUser = await fetchUser();
    if (!dbUser) {
      // Try without isSuperAdmin if still not found
      dbUser = await fetchUser(false);
    }
  }

  // Ensure dbUser exists
  if (!dbUser) {
    throw new Error("Failed to fetch or create user in database");
  }

  return dbUser;
}


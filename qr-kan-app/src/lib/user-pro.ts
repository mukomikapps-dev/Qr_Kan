import { db } from "@/db/client";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user is pro by user ID
 */
export async function isUserPro(userId: string): Promise<boolean> {
  try {
    const user = await db.select({ isPro: users.isPro }).from(users).where(eq(users.id, userId)).limit(1);
    return user[0]?.isPro ?? false;
  } catch {
    return false;
  }
}

/**
 * Check if a user is pro by username
 */
export async function isUserProByUsername(username: string): Promise<boolean> {
  try {
    const result = await db
      .select({ isPro: users.isPro })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(profiles.username, username))
      .limit(1);
    return result[0]?.isPro ?? false;
  } catch {
    return false;
  }
}

/**
 * Check if a user is pro by email
 */
export async function isUserProByEmail(email: string): Promise<boolean> {
  try {
    const user = await db.select({ isPro: users.isPro }).from(users).where(eq(users.email, email)).limit(1);
    return user[0]?.isPro ?? false;
  } catch {
    return false;
  }
}





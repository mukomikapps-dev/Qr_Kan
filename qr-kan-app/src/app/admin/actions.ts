"use server";

import { db } from "@/db/client";
import { users, profiles } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

/**
 * Toggle Pro status for a user
 */
export async function toggleUserProStatus(userId: string, isPro: boolean) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .update(users)
      .set({ isPro })
      .where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Toggle pro status error:", error);
    throw new Error("Failed to update user status");
  }
}

/**
 * Toggle Super Admin status for a user
 */
export async function toggleUserAdminStatus(userId: string, isSuperAdmin: boolean) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  // Prevent removing own admin status
  if (admin.id === userId && !isSuperAdmin) {
    throw new Error("Cannot remove your own admin status");
  }

  try {
    await db
      .update(users)
      .set({ isSuperAdmin })
      .where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    // If isSuperAdmin column doesn't exist yet
    if (error?.message?.includes('is_super_admin') || error?.code === '42703') {
      throw new Error("Admin system not initialized. Please run migration first.");
    }
    console.error("Toggle admin status error:", error);
    throw new Error("Failed to update admin status");
  }
}

/**
 * Delete a user and all associated data
 */
export async function deleteUser(userId: string) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  // Prevent deleting own account
  if (admin.id === userId) {
    throw new Error("Cannot delete your own account");
  }

  try {
    // Delete user (cascade will handle profiles, blocks, etc.)
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    throw new Error("Failed to delete user");
  }
}

/**
 * Get all users with pagination
 */
export async function getAllUsers(page: number = 1, limit: number = 20) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  const offset = (page - 1) * limit;

  try {
    
    const [userList, totalCountResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          isPro: users.isPro,
          isSuperAdmin: users.isSuperAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(users),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;

    return {
      users: userList.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        isPro: u.isPro ?? false,
        isSuperAdmin: u.isSuperAdmin ?? false,
        createdAt: u.createdAt?.toISOString() ?? "",
      })),
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error: any) {
    // If isSuperAdmin column doesn't exist yet
    if (error?.message?.includes('is_super_admin') || error?.code === '42703') {
      const [userList, totalCountResult] = await Promise.all([
        db
          .select({
            id: users.id,
            email: users.email,
            isPro: users.isPro,
            createdAt: users.createdAt,
          })
          .from(users)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(users),
      ]);

      const totalCount = totalCountResult[0]?.count ?? 0;

      return {
        users: userList.map((u) => ({
          id: u.id,
          email: u.email ?? "",
          isPro: u.isPro ?? false,
          isSuperAdmin: false,
          createdAt: u.createdAt?.toISOString() ?? "",
        })),
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      };
    }
    throw error;
  }
}

/**
 * Create a new user account
 */
export async function createNewUser(
  email: string,
  password: string,
  username: string,
  displayName: string,
  isPro: boolean = false,
  isSuperAdmin: boolean = false
) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    throw new Error("Unauthorized");
  }

  // Validate inputs
  if (!email || !password || !username) {
    throw new Error("Email, password, and username are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  // Validate username (alphanumeric and underscore only)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    throw new Error("Username can only contain letters, numbers, and underscores");
  }

  try {
    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username,
        display_name: displayName || username,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData?.user) {
      throw new Error("Failed to create user in Auth");
    }

    const userId = authData.user.id;

    // Step 2: Check if user already exists, then create user in database
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (existingUser.length > 0) {
      // User already exists, skip insert
    } else {
      try {
        await db.insert(users).values({
          id: userId,
          email,
          isPro,
          isSuperAdmin,
        });
      } catch (dbError: any) {
        // If isSuperAdmin column doesn't exist yet
        if (dbError?.message?.includes('is_super_admin') || dbError?.code === '42703') {
          if (isSuperAdmin) {
            throw new Error("Admin system not initialized. Please run migration first.");
          }
          try {
            await db.insert(users).values({
              id: userId,
              email,
              isPro,
            });
          } catch (insertError: any) {
            // Handle duplicate key error - user was created between check and insert
            if (insertError?.code === '23505' || insertError?.message?.includes('duplicate key') || insertError?.message?.includes('already exists')) {
              // User already exists, continue (this is OK)
            } else {
              throw insertError;
            }
          }
        } else if (dbError?.code === '23505' || dbError?.message?.includes('duplicate key') || dbError?.message?.includes('already exists')) {
          // User already exists (race condition), continue (this is OK)
        } else {
          throw dbError;
        }
      }
    }

    // Step 3: Create profile
    const profileId = randomBytes(16).toString('hex');
    
    try {
      await db.insert(profiles).values({
        id: profileId,
        userId,
        username,
        displayName: displayName || username,
        bio: null,
        avatarUrl: null,
      });
    } catch (profileError: any) {
      if (profileError?.message?.includes("already exists") || profileError?.message?.includes("duplicate")) {
        throw new Error("Username already taken");
      }
      throw profileError;
    }

    revalidatePath("/admin");
    return { 
      success: true, 
      userId,
      profileId,
      message: "User created successfully" 
    };
  } catch (error: any) {
    console.error("Create user error:", error);
    throw new Error(error.message || "Failed to create user");
  }
}


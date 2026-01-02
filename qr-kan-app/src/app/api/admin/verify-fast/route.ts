import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fast admin verification endpoint
 * POST /api/admin/verify-fast
 * Optimized for speed - single query, no extra checks
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { isAdmin: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Single optimized query
    try {
      const result = await db
        .select({ isSuperAdmin: users.isSuperAdmin })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const isAdmin = result[0]?.isSuperAdmin === true;

      if (!isAdmin) {
        return NextResponse.json(
          { isAdmin: false, error: "Access denied" },
          { status: 403 }
        );
      }

      return NextResponse.json({ isAdmin: true });
    } catch (error: any) {
      // If column doesn't exist, no one is admin
      if (error?.message?.includes('is_super_admin') || error?.code === '42703') {
        return NextResponse.json(
          { isAdmin: false, error: "Admin system not initialized" },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Admin verify error:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}





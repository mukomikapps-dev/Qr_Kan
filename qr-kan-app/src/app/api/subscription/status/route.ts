import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription-helpers";

export const dynamic = 'force-dynamic';

/**
 * Get current user's subscription status
 * GET /api/subscription/status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(user.id);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get subscription status" },
      { status: 500 }
    );
  }
}





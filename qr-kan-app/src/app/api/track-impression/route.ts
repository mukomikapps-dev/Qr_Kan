import { db } from "@/db/client";
import { blockVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { variantId } = await req.json();
    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json({ error: "Invalid variantId" }, { status: 400 });
    }

    // Fetch current impressions
    const variant = (await db.select().from(blockVariants).where(eq(blockVariants.id, variantId)))[0];
    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    // Increment impressions
    await db
      .update(blockVariants)
      .set({ impressions: (variant.impressions || 0) + 1 })
      .where(eq(blockVariants.id, variantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track impression error:", error);
    return NextResponse.json({ error: "Failed to track impression" }, { status: 500 });
  }
}







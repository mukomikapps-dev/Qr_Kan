import { db } from "@/db/client";
import { blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Get all social blocks
    const socialBlocks = await db
      .select()
      .from(blocks)
      .where(eq(blocks.type, "social"));

    let fixed = 0;
    const results: string[] = [];

    for (const block of socialBlocks) {
      try {
        const data = JSON.parse(block.dataJson) as Record<string, unknown>;
        const platform = String(data.platform || "").toLowerCase();
        let handle = String(data.handle || "");

        // Remove @ prefix if present
        const cleanHandle = handle.replace(/^@+/, "");

        // URL encode the handle to preserve special characters like underscore
        const encodedHandle = encodeURIComponent(cleanHandle);

        let url = "#";
        if (platform === "instagram") url = `https://instagram.com/${encodedHandle}`;
        else if (platform === "tiktok") url = `https://tiktok.com/@${encodedHandle}`;
        else if (platform === "twitter" || platform === "x") url = `https://x.com/${encodedHandle}`;
        else if (platform === "youtube") url = `https://youtube.com/@${encodedHandle}`;

        // Update data with rebuilt URL and cleaned handle
        const updatedData = {
          ...data,
          platform: platform,
          handle: cleanHandle, // Store without @ prefix but with underscore
          url: url,
        };

        await db
          .update(blocks)
          .set({ dataJson: JSON.stringify(updatedData) })
          .where(eq(blocks.id, block.id));

        fixed++;
        results.push(`${block.id}: ${platform}/${cleanHandle} → ${url}`);
      } catch (error) {
        results.push(`Error fixing block ${block.id}: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      fixed,
      total: socialBlocks.length,
      results,
    });
  } catch (error) {
    console.error("Fix error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}







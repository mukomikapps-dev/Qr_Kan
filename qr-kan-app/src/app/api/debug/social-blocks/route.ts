import { db } from "@/db/client";
import { blocks, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all social blocks with profile info
    const socialBlocks = await db
      .select({
        blockId: blocks.id,
        profileId: blocks.profileId,
        username: profiles.username,
        dataJson: blocks.dataJson,
        order: blocks.order,
      })
      .from(blocks)
      .innerJoin(profiles, eq(blocks.profileId, profiles.id))
      .where(eq(blocks.type, "social"))
      .orderBy(blocks.order);

    const result = socialBlocks.map((block: any) => {
      const data = JSON.parse(block.dataJson);
      return {
        blockId: block.blockId,
        username: block.username,
        platform: data.platform,
        handle: data.handle,
        url: data.url,
        order: block.order,
      };
    });

    return NextResponse.json({ 
      count: result.length,
      blocks: result 
    }, { status: 200 });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch social blocks",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}







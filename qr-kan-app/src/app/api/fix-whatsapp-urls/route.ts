import { db } from "@/db/client";
import { blocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Get all WhatsApp blocks
    const whatsappBlocks = await db
      .select()
      .from(blocks)
      .where(eq(blocks.type, "whatsapp"));

    let fixed = 0;
    const results: string[] = [];

    for (const block of whatsappBlocks) {
      try {
        const data = JSON.parse(block.dataJson) as Record<string, unknown>;
        const phone = String(data.phone || "");
        const message = String(data.message || "");

        // Clean phone number (remove non-digits)
        const cleanPhone = phone.replace(/[^0-9]/g, "");

        if (!cleanPhone) {
          results.push(`${block.id}: No phone number found, skipping`);
          continue;
        }

        // Build WhatsApp URL
        const encodedMessage = encodeURIComponent(message);
        const url = message 
          ? `https://wa.me/${cleanPhone}?text=${encodedMessage}` 
          : `https://wa.me/${cleanPhone}`;

        // Update data with rebuilt URL and cleaned phone
        const updatedData = {
          ...data,
          phone: cleanPhone, // Store cleaned phone
          message: message, // Keep message as-is
          url: url,
        };

        await db
          .update(blocks)
          .set({ dataJson: JSON.stringify(updatedData) })
          .where(eq(blocks.id, block.id));

        fixed++;
        results.push(`${block.id}: ${phone} → ${cleanPhone} → ${url}`);
      } catch (error) {
        results.push(`Error fixing block ${block.id}: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      fixed,
      total: whatsappBlocks.length,
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






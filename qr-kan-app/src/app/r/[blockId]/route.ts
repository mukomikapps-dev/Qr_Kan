import { db } from "@/db/client";
import { blocks, blockVariants, clicks } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await context.params;
  const searchParams = req.nextUrl.searchParams;
  const variantId = searchParams.get("v");

  try {
    // Fetch block
    const block = (await db.select().from(blocks).where(eq(blocks.id, blockId)))[0];
    
    if (!block) {
      // Block not found, redirect to home
      redirect("/");
    }

    // Parse block data
    const data = JSON.parse(block.dataJson) as Record<string, unknown>;
    let url = String(data.url || "");

    // For social blocks, ALWAYS rebuild URL from platform + handle (don't trust stored URL)
    // This ensures URL always matches the handle in the editor
    if (block.type === "social") {
      const platform = String(data.platform || "").toLowerCase();
      let handle = String(data.handle || "");
      
      // Remove @ prefix if present
      handle = handle.replace(/^@+/, "");
      
      // URL encode the handle to preserve special characters like underscore
      const encodedHandle = encodeURIComponent(handle);
      
      // Always rebuild URL from current platform and handle
      if (platform === "instagram") url = `https://instagram.com/${encodedHandle}`;
      else if (platform === "tiktok") url = `https://tiktok.com/@${encodedHandle}`;
      else if (platform === "twitter" || platform === "x") url = `https://x.com/${encodedHandle}`;
      else if (platform === "youtube") url = `https://youtube.com/@${encodedHandle}`;
      else url = "#";
    }
    
    // For WhatsApp blocks, ALWAYS rebuild URL from phone + message (don't trust stored URL)
    // This ensures URL always matches the phone number in the editor
    if (block.type === "whatsapp" && data.phone) {
      const phone = String(data.phone || "");
      const message = String(data.message || "");
      
      // Clean phone number (remove non-digits)
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      
      // Build WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      url = message 
        ? `https://wa.me/${cleanPhone}?text=${encodedMessage}` 
        : `https://wa.me/${cleanPhone}`;
    }

    // If variant ID is provided, use variant data
    if (variantId) {
      const variant = (await db.select().from(blockVariants).where(eq(blockVariants.id, variantId)))[0];
      if (variant && variant.blockId === blockId) {
        const variantData = JSON.parse(variant.dataJson) as Record<string, unknown>;
        url = String(variantData.url || url);
        
        // Rebuild URL for social variant if needed
        if (block.type === "social" && (!url || url === "#")) {
          const platform = String(variantData.platform || data.platform || "").toLowerCase();
          let handle = String(variantData.handle || data.handle || "");
          handle = handle.replace(/^@+/, "");
          const encodedHandle = encodeURIComponent(handle);
          
          if (platform === "instagram") url = `https://instagram.com/${encodedHandle}`;
          else if (platform === "tiktok") url = `https://tiktok.com/@${encodedHandle}`;
          else if (platform === "twitter" || platform === "x") url = `https://x.com/${encodedHandle}`;
          else if (platform === "youtube") url = `https://youtube.com/@${encodedHandle}`;
          else url = "#";
        }
        
        // Rebuild URL for WhatsApp variant if needed
        if (block.type === "whatsapp" && (variantData.phone || data.phone)) {
          const phone = String(variantData.phone || data.phone || "");
          const message = String(variantData.message || data.message || "");
          
          // Clean phone number (remove non-digits)
          const cleanPhone = phone.replace(/[^0-9]/g, "");
          
          // Build WhatsApp URL
          const encodedMessage = encodeURIComponent(message);
          url = message 
            ? `https://wa.me/${cleanPhone}?text=${encodedMessage}` 
            : `https://wa.me/${cleanPhone}`;
        }
        
        // Track variant click - only once per request
        try {
          // Check if click already tracked in the last 2 seconds (prevent double counting)
          const twoSecondsAgo = new Date(Date.now() - 2000);
          const existingClick = await db
            .select()
            .from(clicks)
            .where(
              and(
                eq(clicks.blockId, block.id),
                eq(clicks.variantId, variant.id)
              )
            )
            .then(r => r.filter(c => {
              // Check if click was made in the last 2 seconds (likely duplicate)
              if (!c.ts) return false;
              const clickTime = new Date(c.ts).getTime();
              return clickTime >= twoSecondsAgo.getTime();
            }));
          
          if (existingClick.length === 0) {
            await db.insert(clicks).values({
              id: randomUUID(),
              blockId: block.id,
              variantId: variant.id,
              ts: new Date(),
            });
          }
        } catch (err) {
          // Ignore click tracking errors (might be duplicate or constraint issue)
        }
      }
    } else {
      // Track regular click (no variant) - only once per request
      try {
        // Check if click already tracked in the last 2 seconds (prevent double counting)
        const twoSecondsAgo = new Date(Date.now() - 2000);
        const existingClick = await db
          .select()
          .from(clicks)
          .where(
            and(
              eq(clicks.blockId, block.id),
              isNull(clicks.variantId)
            )
          )
          .then(r => r.filter(c => {
            // Check if click was made in the last 2 seconds (likely duplicate)
            if (!c.ts) return false;
            const clickTime = new Date(c.ts).getTime();
            return clickTime >= twoSecondsAgo.getTime();
          }));
        
        if (existingClick.length === 0) {
          await db.insert(clicks).values({
            id: randomUUID(),
            blockId: block.id,
            variantId: null,
            ts: new Date(),
          });
        }
      } catch (err) {
        // Ignore click tracking errors (might be duplicate or constraint issue)
      }
    }

    // Validate URL - support various URL schemes
    const validUrlSchemes = ["http://", "https://", "mailto:", "tel:", "sms:", "whatsapp://"];
    const isValidUrl = url && validUrlSchemes.some(scheme => url.startsWith(scheme));
    
    if (!isValidUrl) {
      // Invalid URL, redirect to home
      redirect("/");
    }

    // Redirect to the URL
    // Use NextResponse.redirect() for all external URLs (http, https, mailto, tel, etc)
    // redirect() from next/navigation only works for internal paths
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error("Redirect error:", error);
    // On error, redirect to home
    redirect("/");
  }
}


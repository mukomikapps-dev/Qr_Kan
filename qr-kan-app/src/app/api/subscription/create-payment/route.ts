import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { users, paymentRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getSubscriptionPricing, calculateSubscriptionEndDate } from "@/lib/subscription-helpers";
import { getMootaBanks, formatVirtualAccount } from "@/lib/moota-client";

export const dynamic = 'force-dynamic';

/**
 * Create payment request for subscription upgrade
 * POST /api/subscription/create-payment
 * Body: { tier: "pro" | "business", duration: "monthly" | "yearly" }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier, duration = "monthly" } = body;

    if (!tier || (tier !== "pro" && tier !== "business")) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'pro' or 'business'" },
        { status: 400 }
      );
    }

    // Get user from database
    const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (dbUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get pricing
    const pricing = getSubscriptionPricing(tier as "pro" | "business");
    const amount = duration === "yearly" ? pricing.yearly : pricing.monthly;

    // Get Moota banks (use QR Kan account with bank_id dE6jR7neWNQ or first available bank)
    let virtualAccount = "";
    let bankId = "";
    
    // Default bank_id for QR Kan account (offline account)
    const defaultBankId = process.env.MOOTA_BANK_ID || "dE6jR7neWNQ";
    // Fallback account number for Mandiri (ugeng_hariadi account)
    const fallbackAccountNumber = process.env.MOOTA_ACCOUNT_NUMBER || "1320006396064";
    
    try {
      const banks = await getMootaBanks();
      console.log("Fetched Moota banks:", banks);
      
      if (banks.length > 0) {
        // Try to find the QR Kan account (bank_id: dE6jR7neWNQ) first
        const qrKanBank = banks.find(b => b.bank_id === defaultBankId);
        if (qrKanBank && qrKanBank.account_number) {
          virtualAccount = qrKanBank.account_number;
          bankId = qrKanBank.bank_id;
          console.log("Using QR Kan bank account:", virtualAccount, "bank_id:", bankId);
        } else {
          // Use the first bank's account number that has account_number
          const firstBankWithAccount = banks.find(b => b.account_number);
          if (firstBankWithAccount) {
            virtualAccount = firstBankWithAccount.account_number;
            bankId = firstBankWithAccount.bank_id || "";
            console.log("Using first available bank account:", virtualAccount, "bank_id:", bankId);
          }
        }
      }
    } catch (error) {
      console.error("Error getting Moota banks:", error);
    }

    // Fallback to Mandiri account number if no account found
    // Note: QR Kan is an offline account, so it may not have account_number
    // We'll use the Mandiri account number (1320006396064) as fallback
    if (!virtualAccount) {
      virtualAccount = fallbackAccountNumber;
      bankId = defaultBankId; // Still use QR Kan bank_id for tracking
      console.log("Using fallback Mandiri account number:", virtualAccount);
    }

    // Create payment request
    const paymentRequestId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire after 24 hours

    // Check if there's a pending payment request for this user
    const existingPending = await db
      .select()
      .from(paymentRequests)
      .where(and(
        eq(paymentRequests.userId, user.id),
        eq(paymentRequests.status, "pending")
      ))
      .limit(1);

    if (existingPending.length > 0) {
      // Update existing pending request
      await db
        .update(paymentRequests)
        .set({
          tier,
          amount,
          virtualAccount,
          expiresAt,
          createdAt: new Date(),
        })
        .where(eq(paymentRequests.id, existingPending[0].id));

      return NextResponse.json({
        success: true,
        paymentRequestId: existingPending[0].id,
        virtualAccount: formatVirtualAccount(virtualAccount),
        amount,
        currency: pricing.currency,
        expiresAt: expiresAt.toISOString(),
        message: `Transfer Rp ${amount.toLocaleString("id-ID")} ke rekening ${formatVirtualAccount(virtualAccount)}. Pembayaran akan diverifikasi otomatis.`,
      });
    }

    // Create new payment request
    try {
      await db.insert(paymentRequests).values({
        id: paymentRequestId,
        userId: user.id,
        tier,
        amount,
        status: "pending",
        virtualAccount,
        paymentMethod: "bank_transfer",
        expiresAt,
      });

      return NextResponse.json({
        success: true,
        paymentRequestId,
        virtualAccount: formatVirtualAccount(virtualAccount),
        amount,
        currency: pricing.currency,
        expiresAt: expiresAt.toISOString(),
        message: `Transfer Rp ${amount.toLocaleString("id-ID")} ke rekening ${formatVirtualAccount(virtualAccount)}. Pembayaran akan diverifikasi otomatis.`,
      });
    } catch (error: any) {
      // Handle case where payment_requests table doesn't exist yet
      if (error?.message?.includes('payment_requests') || error?.code === '42P01') {
        return NextResponse.json(
          { error: "Payment system not initialized. Please run migration first." },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error creating payment request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment request" },
      { status: 500 }
    );
  }
}


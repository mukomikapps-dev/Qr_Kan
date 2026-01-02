import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, paymentRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateUserSubscription, calculateSubscriptionEndDate } from "@/lib/subscription-helpers";

export const dynamic = 'force-dynamic';

/**
 * Webhook handler for Moota payment notifications
 * POST /api/subscription/webhook-moota
 * 
 * This endpoint should be configured in Moota dashboard to receive mutation notifications
 */
export async function POST(request: NextRequest) {
    try {
        // Verify webhook secret (optional but recommended)
        // For initial setup/testing: Skip validation if MOOTA_WEBHOOK_SECRET is not set
        // For production: Set MOOTA_WEBHOOK_SECRET in environment variables and ensure it matches the secret in Moota dashboard
        const expectedSecret = process.env.MOOTA_WEBHOOK_SECRET;

        // Only validate secret if both are configured
        if (expectedSecret) {
            // Moota may send secret in different header formats or in body
            const webhookSecret = request.headers.get("x-moota-secret")
                || request.headers.get("x-webhook-secret")
                || request.headers.get("secret")
                || request.headers.get("x-secret-token");

            // If secret is provided but doesn't match, reject it
            // But if no secret is provided in headers, allow it (Moota may send it differently during testing)
            if (webhookSecret && webhookSecret.trim() !== "" && webhookSecret !== expectedSecret) {
                console.warn("Webhook secret mismatch. Expected:", expectedSecret.substring(0, 5) + "...", "Got:", webhookSecret.substring(0, 5) + "...");
                return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
            }
        }
        // If MOOTA_WEBHOOK_SECRET is not set, skip validation entirely (for testing/setup)

        const body = await request.json();

        // Moota webhook payload structure (adjust based on actual Moota webhook format)
        // Typically includes: mutation_id, bank_id, account_number, amount, description, type, date
        const {
            mutation_id,
            account_number,
            amount,
            description,
            type, // "credit" or "debit"
            date,
        } = body;

        // Only process credit (incoming) transactions
        if (type !== "credit") {
            return NextResponse.json({ success: true, message: "Ignored: not a credit transaction" });
        }

        // Find matching pending payment request
        const pendingPayments = await db
            .select()
            .from(paymentRequests)
            .where(and(
                eq(paymentRequests.status, "pending"),
                eq(paymentRequests.virtualAccount, account_number.replace(/\D/g, "")) // Remove non-digits for comparison
            ));

        for (const payment of pendingPayments) {
            // Check if amount matches (within small tolerance for bank fees)
            const amountMatch = Math.abs(payment.amount - amount) <= 1000; // Allow 1000 IDR difference for fees

            if (amountMatch) {
                // Update payment request status
                await db
                    .update(paymentRequests)
                    .set({
                        status: "paid",
                        mootaTransactionId: mutation_id,
                        paidAt: new Date(date || new Date()),
                    })
                    .where(eq(paymentRequests.id, payment.id));

                // Update user subscription
                const startDate = new Date();
                const endDate = calculateSubscriptionEndDate(
                    startDate,
                    payment.tier === "business" ? 1 : 1 // 1 month for now (adjust based on duration if stored)
                );

                await updateUserSubscription(
                    payment.userId,
                    payment.tier as "pro" | "business",
                    "active",
                    startDate,
                    endDate
                );

                console.log(`Payment verified and subscription updated for user ${payment.userId}, tier: ${payment.tier}`);

                return NextResponse.json({
                    success: true,
                    message: "Payment verified and subscription updated",
                    paymentRequestId: payment.id,
                    userId: payment.userId,
                });
            }
        }

        // No matching payment found
        return NextResponse.json({
            success: true,
            message: "No matching payment request found",
        });
    } catch (error: any) {
        console.error("Error processing Moota webhook:", error);

        // Still return 200 to prevent Moota from retrying
        return NextResponse.json(
            { error: error.message || "Error processing webhook" },
            { status: 200 }
        );
    }
}


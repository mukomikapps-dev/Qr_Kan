import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SubscriptionTier = "free" | "pro" | "business";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
}

/**
 * Get subscription info for a user
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  try {
    const user = await db
      .select({
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionStartDate: users.subscriptionStartDate,
        subscriptionEndDate: users.subscriptionEndDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return {
        tier: "free",
        status: "active",
        startDate: null,
        endDate: null,
        isActive: true,
      };
    }

    const u = user[0];
    const tier = (u.subscriptionTier as SubscriptionTier) || "free";
    const status = (u.subscriptionStatus as SubscriptionStatus) || "active";
    const endDate = u.subscriptionEndDate ? new Date(u.subscriptionEndDate) : null;
    
    // Check if subscription is still active (not expired)
    const isActive = status === "active" && (!endDate || endDate > new Date());

    return {
      tier,
      status,
      startDate: u.subscriptionStartDate ? new Date(u.subscriptionStartDate) : null,
      endDate,
      isActive,
    };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    // Return free tier on error
    return {
      tier: "free",
      status: "active",
      startDate: null,
      endDate: null,
      isActive: true,
    };
  }
}

/**
 * Check if user has active subscription of specific tier or higher
 */
export async function hasActiveSubscription(
  userId: string,
  requiredTier: SubscriptionTier = "pro"
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription.isActive) {
    return false;
  }

  const tierLevels: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 1,
    business: 2,
  };

  return tierLevels[subscription.tier] >= tierLevels[requiredTier];
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(
  userId: string,
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  startDate?: Date,
  endDate?: Date
): Promise<void> {
  try {
    // Try to update with all subscription fields
    await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionStartDate: startDate || null,
        subscriptionEndDate: endDate || null,
        // Also update isPro for backward compatibility
        isPro: tier !== "free",
      })
      .where(eq(users.id, userId));
  } catch (error: any) {
    // If subscription columns don't exist yet, try updating only isPro
    if (error?.message?.includes('subscription_tier') || error?.code === '42703') {
      console.warn("Subscription columns not available, updating isPro only");
      await db
        .update(users)
        .set({
          isPro: tier !== "free",
        })
        .where(eq(users.id, userId));
    } else {
      throw error;
    }
  }
}

/**
 * Get subscription pricing
 */
export function getSubscriptionPricing(tier: SubscriptionTier): {
  monthly: number;
  yearly: number;
  currency: string;
} {
  const pricing: Record<SubscriptionTier, { monthly: number; yearly: number; currency: string }> = {
    free: { monthly: 0, yearly: 0, currency: "IDR" },
    pro: { monthly: 75000, yearly: 750000, currency: "IDR" }, // ~20% discount for yearly
    business: { monthly: 250000, yearly: 2500000, currency: "IDR" },
  };

  return pricing[tier];
}

/**
 * Calculate subscription end date
 */
export function calculateSubscriptionEndDate(startDate: Date, durationMonths: number): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);
  return endDate;
}





/**
 * Subscription pricing constants
 * This file can be safely imported in client components
 */

export type SubscriptionTier = "free" | "pro" | "business";

export const subscriptionPricing: Record<SubscriptionTier, { monthly: number; yearly: number; currency: string }> = {
  free: { monthly: 0, yearly: 0, currency: "IDR" },
  pro: { monthly: 75000, yearly: 750000, currency: "IDR" }, // ~20% discount for yearly
  business: { monthly: 250000, yearly: 2500000, currency: "IDR" },
};

/**
 * Get subscription pricing for a tier
 */
export function getSubscriptionPricing(tier: SubscriptionTier): {
  monthly: number;
  yearly: number;
  currency: string;
} {
  return subscriptionPricing[tier];
}





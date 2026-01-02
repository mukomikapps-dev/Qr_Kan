"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSubscriptionPricing } from "@/lib/subscription-pricing";
import { SubscriptionInfo } from "@/lib/subscription-helpers";

export default function SubscriptionPageClient({
  initialSubscription,
  userId,
}: {
  initialSubscription: SubscriptionInfo | null;
  userId: string;
}) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(initialSubscription);
  const [selectedTier, setSelectedTier] = useState<"pro" | "business">("pro");
  const [selectedDuration, setSelectedDuration] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (initialSubscription) {
      setSubscription(initialSubscription);
    }
  }, [initialSubscription]);

  const handleUpgrade = () => {
    // Show alert when user tries to checkout/pay
    alert("Fitur Subscription segera hadir. Terima kasih atas kesabaran Anda!");
  };

  const currentTier = subscription?.tier || "free";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900">Subscription</h1>
        </div>

        {/* Current Subscription Status */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-zinc-900 capitalize mb-1">
                {currentTier} Plan
              </div>
              {subscription?.endDate && subscription.isActive && (
                <div className="text-sm text-zinc-600">
                  Valid until: {(subscription.endDate instanceof Date ? subscription.endDate : new Date(subscription.endDate)).toLocaleDateString("id-ID")}
                </div>
              )}
              {!subscription?.isActive && (
                <div className="text-sm text-red-600">Subscription expired</div>
              )}
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-semibold ${
                subscription?.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {subscription?.status === "active" ? "Active" : "Inactive"}
            </div>
          </div>
        </div>

        {/* All Plans */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Choose Your Plan</h2>

          {/* Duration Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSelectedDuration("monthly")}
              className={`flex-1 py-3 rounded-lg border-2 transition ${
                selectedDuration === "monthly"
                  ? "border-emerald-500 bg-emerald-50 font-semibold"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedDuration("yearly")}
              className={`flex-1 py-3 rounded-lg border-2 transition ${
                selectedDuration === "yearly"
                  ? "border-emerald-500 bg-emerald-50 font-semibold"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>

          {/* Tier Selection - All 3 Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Tier */}
            <div
              className={`p-4 rounded-lg border-2 transition ${
                currentTier === "free"
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="font-bold text-lg mb-2 capitalize">Free</div>
              <div className="text-2xl font-bold mb-1">Rp 0</div>
              <div className="text-sm text-zinc-600">Free forever</div>
              <div className="text-xs text-zinc-500 mt-2 mb-4">
                • 1 profile
                <br />• Basic blocks
                <br />• Basic analytics
              </div>
              {currentTier === "free" ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg bg-zinc-200 text-zinc-600 font-semibold cursor-not-allowed text-center"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full py-2 rounded-lg border-2 border-zinc-300 bg-white text-zinc-700 font-semibold hover:bg-zinc-50 transition text-center"
                >
                  Downgrade
                </button>
              )}
            </div>

            {/* Pro Tier */}
            <div
              className={`p-4 rounded-lg border-2 transition text-left ${
                currentTier === "pro"
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500"
                  : selectedTier === "pro"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="font-bold text-lg mb-2 capitalize">Pro</div>
              <div className="text-2xl font-bold mb-1">
                Rp {getSubscriptionPricing("pro")[selectedDuration].toLocaleString("id-ID")}
              </div>
              <div className="text-sm text-zinc-600">
                per {selectedDuration === "monthly" ? "month" : "year"}
              </div>
              <div className="text-xs text-zinc-500 mt-2 mb-4">
                • Unlimited profiles
                <br />• All block types
                <br />• Advanced analytics
                <br />• Custom QR code
                <br />• Custom domain
              </div>
              {currentTier === "pro" ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg bg-zinc-200 text-zinc-600 font-semibold cursor-not-allowed text-center"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTier("pro");
                    handleUpgrade();
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-center"
                >
                  {currentTier === "free" ? "Upgrade" : "Switch"} to Pro
                </button>
              )}
            </div>

            {/* Business Tier */}
            <div
              className={`p-4 rounded-lg border-2 transition text-left ${
                currentTier === "business"
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500"
                  : selectedTier === "business"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="font-bold text-lg mb-2 capitalize">Business</div>
              <div className="text-2xl font-bold mb-1">
                Rp {getSubscriptionPricing("business")[selectedDuration].toLocaleString("id-ID")}
              </div>
              <div className="text-sm text-zinc-600">
                per {selectedDuration === "monthly" ? "month" : "year"}
              </div>
              <div className="text-xs text-zinc-500 mt-2 mb-4">
                • All Pro features
                <br />• Team collaboration
                <br />• White-label
                <br />• Priority support
                <br />• API access
              </div>
              {currentTier === "business" ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg bg-zinc-200 text-zinc-600 font-semibold cursor-not-allowed text-center"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTier("business");
                    handleUpgrade();
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-center"
                >
                  {currentTier === "free" ? "Upgrade" : "Switch"} to Business
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


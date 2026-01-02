import Link from "next/link";

export default function SubscriptionButton() {
  return (
    <Link
      href="/dashboard/subscription"
      className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors shadow-sm opacity-75"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
      Subscription
    </Link>
  );
}

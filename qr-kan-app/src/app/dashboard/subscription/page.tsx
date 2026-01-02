import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubscriptionPageClient from "./SubscriptionPageClient";
import { getUserSubscription } from "@/lib/subscription-helpers";

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(user.id);

  return (
    <SubscriptionPageClient initialSubscription={subscription} userId={user.id} />
  );
}


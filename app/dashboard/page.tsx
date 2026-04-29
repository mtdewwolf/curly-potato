import Link from "next/link";
import { NotificationList } from "@/components/notification-list";
import { ServiceCard } from "@/components/service-card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Sign in required</h1>
        <p className="mt-3 text-slate-600">Create a free account to follow services and manage alerts.</p>
        <Link href="/auth/sign-in" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Sign in
        </Link>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: subscriptions }, { data: notifications }, { data: suggestions }] = await Promise.all([
    supabase.from("user_service_subscriptions").select("id, tracked_services(*)").eq("user_id", profile.id),
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("tracking_suggestions").select("*").eq("submitted_by", profile.id).order("created_at", { ascending: false }).limit(10)
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold">Your dashboard</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="text-xl font-semibold">Followed services</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(subscriptions as any[] | null)?.map((subscription) =>
              subscription.tracked_services ? <ServiceCard key={subscription.id} service={subscription.tracked_services} /> : null
            )}
            {!subscriptions?.length ? <p className="rounded-3xl border border-dashed p-6 text-sm text-slate-600">You are not following any services yet.</p> : null}
          </div>
        </section>
        <section className="space-y-6">
          <NotificationList notifications={notifications ?? []} />
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Suggestion statuses</h2>
            <div className="mt-4 space-y-3">
              {(suggestions as any[] | null)?.map((suggestion) => (
                <div key={suggestion.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <div className="font-medium">{suggestion.company_name}</div>
                  <div className="text-slate-600">Status: {suggestion.status.replaceAll("_", " ")}</div>
                </div>
              ))}
              {!suggestions?.length ? <p className="text-sm text-slate-600">No suggestions yet.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

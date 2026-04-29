import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { PolicyChangeTimeline } from "@/components/policy-change-timeline";
import { PolicyDocumentList } from "@/components/policy-document-list";
import { RiskBadge } from "@/components/risk-badge";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: service } = await supabase.from("tracked_services").select("*").eq("slug", slug).eq("status", "active").single();
  if (!service) notFound();

  const [{ data: documents }, { data: changes }, { data: subscription }] = await Promise.all([
    supabase.from("policy_documents").select("*").eq("service_id", service.id).eq("status", "active"),
    supabase
      .from("policy_changes")
      .select("*, policy_documents!inner(document_type, service_id)")
      .eq("status", "published")
      .eq("policy_documents.service_id", service.id)
      .order("published_at", { ascending: false })
      .limit(10),
    user ? supabase.from("user_service_subscriptions").select("id").eq("user_id", user.id).eq("service_id", service.id).maybeSingle() : Promise.resolve({ data: null })
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{service.category}</p>
              <h1 className="mt-2 text-4xl font-bold text-slate-950">{service.name}</h1>
              <p className="mt-4 max-w-2xl text-slate-600">{service.description}</p>
            </div>
            <RiskBadge level={service.overall_risk_level} />
          </div>
          <div className="mt-8 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-950">Website</span>
              <p>{service.website_url ? <Link href={service.website_url}>{service.website_url}</Link> : "Not listed"}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-950">Last checked</span>
              <p>{service.last_checked_at ? new Date(service.last_checked_at).toLocaleString() : "Not yet checked"}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-950">Followers</span>
              <p>{service.subscriber_count}</p>
            </div>
          </div>
        </section>
        <aside className="rounded-3xl border bg-slate-950 p-6 text-white">
          <h2 className="text-xl font-semibold">Follow policy updates</h2>
          <p className="mt-3 text-sm text-slate-300">Get notified after reviewers approve meaningful changes.</p>
          <div className="mt-6">
            <FollowButton serviceId={service.id} serviceSlug={service.slug} isFollowing={Boolean(subscription)} isLoggedIn={Boolean(user)} />
          </div>
        </aside>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <PolicyDocumentList documents={documents ?? []} />
        <PolicyChangeTimeline changes={changes ?? []} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight, Bell, FileSearch, ShieldCheck } from "lucide-react";
import { ServiceCard } from "@/components/service-card";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("tracked_services")
    .select("*")
    .eq("status", "active")
    .order("last_changed_at", { ascending: false, nullsFirst: false })
    .limit(6);

  const { data: categories } = await supabase
    .from("tracked_services")
    .select("category")
    .eq("status", "active")
    .not("category", "is", null);

  const topCategories = Array.from(
    (categories ?? []).reduce((map, row) => {
      if (row.category) map.set(row.category, (map.get(row.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-7">
          <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-cyan-200">
            Threat intelligence for the fine print.
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Track the fine print before it tracks you.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              TOS Sentinel monitors Terms of Service and Privacy Policy changes across major apps,
              platforms, AI tools, payment services, and SaaS products.
            </p>
            <p className="max-w-2xl leading-7 text-slate-400">
              Follow the services you use. Get alerted when the rules change. Understand what changed,
              why it matters, and whether it increases privacy or data-security risk.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/services" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">
              Browse Services
            </Link>
            <Link href="/login" className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white">
              Create Free Account
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-950/30">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Watchdog Queue</p>
              <h2 className="text-2xl font-semibold text-white">Public-interest monitoring</h2>
            </div>
            <ShieldCheck className="text-cyan-300" />
          </div>
          <div className="grid gap-4">
            {[
              ["Evidence first", "Every AI finding must cite policy text."],
              ["Admin reviewed", "No user alerts go out before human approval."],
              ["Cost controlled", "LLM analysis only runs when content hashes change."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [FileSearch, "Detect", "Fetch, extract, normalize, and hash policy documents."],
          [ShieldCheck, "Assess", "Generate structured risk findings with evidence and confidence."],
          [Bell, "Alert", "Notify followers only after approved meaningful changes."],
        ].map(([Icon, title, body]) => {
          const TypedIcon = Icon as typeof FileSearch;
          return (
            <div key={title as string} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <TypedIcon className="mb-4 text-cyan-300" />
              <h3 className="text-xl font-semibold text-white">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body as string}</p>
            </div>
          );
        })}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-white">Recently changed services</h2>
            <p className="text-slate-400">Approved changes and tracked services appear here as scans complete.</p>
          </div>
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
            View directory <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(services ?? []).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <h2 className="text-2xl font-semibold text-white">Top tracked categories</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {topCategories.map(([category, count]) => (
            <Link
              key={category}
              href={`/services?category=${encodeURIComponent(category)}`}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              {category} <span className="text-slate-500">({count})</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

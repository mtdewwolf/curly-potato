import { ServiceCard } from "@/components/service-card";
import { ServiceFilterBar } from "@/components/service-filter-bar";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ category?: string; risk?: string; recently?: string; sort?: string; document_type?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("tracked_services").select("*").eq("status", "active");
  if (params.category) query = query.eq("category", params.category);
  if (params.risk) query = query.eq("overall_risk_level", params.risk);
  if (params.recently === "true") query = query.not("last_changed_at", "is", null).order("last_changed_at", { ascending: false });
  else if (params.sort === "followers") query = query.order("subscriber_count", { ascending: false });
  else query = query.order("name");

  const { data: services } = await query;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Tracked services</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Browse monitored policies</h1>
      </div>
      <ServiceFilterBar />
      {services?.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <EmptyState title="No services match those filters" description="Try a broader category or risk level." />
      )}
    </main>
  );
}

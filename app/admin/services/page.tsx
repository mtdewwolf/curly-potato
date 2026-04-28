import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminServiceForm } from "@/components/admin-service-form";
import { RiskBadge } from "@/components/risk-badge";
import { archiveServiceAction } from "@/lib/actions/admin";

export default async function AdminServicesPage() {
  await requireRole(["admin"]);
  const supabase = createAdminClient();
  const { data: services } = await supabase.from("tracked_services").select("*").order("name");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Tracked services</h1>
      <AdminServiceForm />
      <div className="mt-8 grid gap-4">
        {services?.map((service) => (
          <div key={service.id} className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link href={`/admin/services/${service.id}`} className="text-xl font-semibold hover:underline">
                  {service.name}
                </Link>
                <p className="text-sm text-slate-600">{service.website_url}</p>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={service.overall_risk_level} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{service.status}</span>
                <form action={archiveServiceAction}>
                  <input type="hidden" name="serviceId" value={service.id} />
                  <button className="rounded-full border px-3 py-1 text-xs font-semibold">Archive</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

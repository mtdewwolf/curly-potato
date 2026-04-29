import Link from "next/link";

import { RiskBadge } from "@/components/risk-badge";
import type { Service } from "@/lib/supabase/types";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/service/${service.slug}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{service.category ?? "Other"}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{service.name}</h3>
        </div>
        <RiskBadge level={service.overall_risk_level} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600">{service.description ?? "Policy monitoring is configured for this service."}</p>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span>{service.subscriber_count} followers</span>
        <span>{service.last_changed_at ? `Changed ${new Date(service.last_changed_at).toLocaleDateString()}` : "No published changes yet"}</span>
      </div>
    </Link>
  );
}

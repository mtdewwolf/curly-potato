import Link from "next/link";
import { SeverityBadge } from "@/components/severity-badge";
import type { PolicyChange } from "@/lib/supabase/types";

export function PolicyChangeCard({
  change,
  serviceName,
  documentType,
}: {
  change: PolicyChange;
  serviceName?: string;
  documentType?: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {serviceName} {documentType ? `- ${documentType}` : ""}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            {change.change_summary ?? "Policy update pending summary"}
          </h3>
        </div>
        <SeverityBadge severity={change.risk_impact_level} />
      </div>
      <p className="mt-4 text-sm text-slate-600">Status: {change.status.replaceAll("_", " ")}</p>
      <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700" href={`/reports/${change.id}`}>
        View report
      </Link>
    </article>
  );
}

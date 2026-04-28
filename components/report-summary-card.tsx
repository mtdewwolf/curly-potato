import { RiskBadge } from "@/components/risk-badge";

export function ReportSummaryCard({
  score,
  level,
  summary,
}: {
  score: number;
  level: string;
  summary: string | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge level={level} />
        <span className="text-sm font-medium text-slate-500">Score {score}/10</span>
      </div>
      <p className="mt-4 text-slate-700">{summary ?? "No public summary is available yet."}</p>
    </section>
  );
}

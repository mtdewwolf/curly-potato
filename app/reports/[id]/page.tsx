import { notFound } from "next/navigation";
import { CategoryScoreCard } from "@/components/category-score-card";
import { ReportSummaryCard } from "@/components/report-summary-card";
import { createClient } from "@/lib/supabase/server";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("risk_reports")
    .select("*, risk_findings(*)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!report) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <ReportSummaryCard score={report.overall_score} level={report.overall_level} summary={report.plain_english_summary ?? report.summary} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {report.risk_findings?.map((finding: any) => (
          <CategoryScoreCard
            key={finding.id}
            category={finding.category}
            severity={finding.severity}
            score={finding.score}
            explanation={finding.explanation}
            evidence={finding.evidence}
          />
        ))}
      </div>
    </main>
  );
}

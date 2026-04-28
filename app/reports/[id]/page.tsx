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
      <ReportSummaryCard report={report} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {report.risk_findings?.map((finding) => <CategoryScoreCard key={finding.id} finding={finding} />)}
      </div>
    </main>
  );
}

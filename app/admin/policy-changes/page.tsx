import { AdminReviewActions } from "@/components/admin-review-actions";
import { DiffViewer } from "@/components/diff-viewer";
import { EvidenceBlock } from "@/components/evidence-block";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPolicyChangesPage() {
  await requireRole(["admin", "reviewer"]);
  const supabase = createAdminClient();
  const { data: changes } = await supabase
    .from("policy_changes")
    .select("*, policy_documents(document_type, tracked_services(name, slug)), policy_change_findings(*), old_snapshot:policy_snapshots!policy_changes_old_snapshot_id_fkey(cleaned_text), new_snapshot:policy_snapshots!policy_changes_new_snapshot_id_fkey(cleaned_text)")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Admin</p>
        <h1 className="text-3xl font-bold text-slate-950">Policy change review</h1>
      </div>
      {(changes as any[] | null)?.map((change) => {
        const document = Array.isArray(change.policy_documents) ? change.policy_documents[0] : change.policy_documents;
        const service = document && (Array.isArray(document.tracked_services) ? document.tracked_services[0] : document.tracked_services);
        const oldSnapshot = Array.isArray(change.old_snapshot) ? change.old_snapshot[0] : change.old_snapshot;
        const newSnapshot = Array.isArray(change.new_snapshot) ? change.new_snapshot[0] : change.new_snapshot;
        return (
          <article key={change.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">{service?.name} / {document?.document_type}</p>
              <h2 className="text-xl font-semibold text-slate-950">{change.change_summary ?? "Pending AI summary"}</h2>
              <p className="text-sm text-slate-500">Status: {change.status} / Risk impact: {change.risk_impact_level ?? "Unrated"}</p>
            </div>
            <div className="grid gap-3">
              {change.policy_change_findings?.map((finding: any) => (
                <EvidenceBlock key={finding.id} title={finding.title}>
                  {[finding.before_text, finding.after_text].filter(Boolean).map((evidence) => (
                    <blockquote key={evidence} className="mb-2 rounded-xl bg-white p-3 text-xs text-slate-600">{evidence}</blockquote>
                  ))}
                  <p>{finding.explanation}</p>
                  <p className="mt-2 text-slate-600">{finding.user_impact}</p>
                </EvidenceBlock>
              ))}
            </div>
            <DiffViewer oldText={oldSnapshot?.cleaned_text ?? ""} newText={newSnapshot?.cleaned_text ?? ""} />
            <AdminReviewActions changeId={change.id} defaultSummary={change.change_summary ?? ""} />
          </article>
        );
      })}
    </div>
  );
}

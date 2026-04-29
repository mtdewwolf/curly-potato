import { PolicyChangeCard } from "@/components/policy-change-card";
import type { PolicyChange } from "@/lib/supabase/types";

export function PolicyChangeTimeline({ changes }: { changes: PolicyChange[] }) {
  if (!changes.length) {
    return <p className="text-sm text-slate-500">No approved changes yet.</p>;
  }

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <PolicyChangeCard key={change.id} change={change} />
      ))}
    </div>
  );
}

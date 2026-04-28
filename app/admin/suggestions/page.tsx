import { approveSuggestionFormAction, reviewSuggestionAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSuggestionsPage() {
  await requireRole(["admin", "reviewer"]);
  const supabase = createAdminClient();
  const { data: suggestions } = await supabase
    .from("tracking_suggestions")
    .select("*, profiles(email)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold">Suggestion review</h1>
      <div className="space-y-4">
        {suggestions?.map((suggestion) => (
          <article key={suggestion.id} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{suggestion.status}</p>
                <h2 className="text-2xl font-semibold">{suggestion.company_name}</h2>
                <p className="text-sm text-slate-500">
                  Submitted by {Array.isArray(suggestion.profiles) ? suggestion.profiles[0]?.email : suggestion.profiles?.email ?? "unknown"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{suggestion.category ?? "Uncategorized"}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div><dt className="font-medium">Website</dt><dd>{suggestion.website_url ?? "Not provided"}</dd></div>
              <div><dt className="font-medium">Terms</dt><dd className="break-all">{suggestion.terms_url ?? "Not provided"}</dd></div>
              <div><dt className="font-medium">Privacy</dt><dd className="break-all">{suggestion.privacy_url ?? "Not provided"}</dd></div>
            </dl>
            <p className="mt-4 text-slate-700">{suggestion.reason}</p>
            {suggestion.notes && <p className="mt-2 text-sm text-slate-500">Notes: {suggestion.notes}</p>}
            {suggestion.status === "pending" && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <form action={approveSuggestionFormAction} className="rounded-2xl bg-emerald-50 p-4">
                  <input type="hidden" name="suggestionId" value={suggestion.id} />
                  <textarea name="adminNotes" className="mb-3 min-h-20 w-full rounded-xl border p-3 text-sm" placeholder="Approval notes" />
                  <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Approve and create service</button>
                </form>
                <form action={reviewSuggestionAction} className="rounded-2xl bg-slate-50 p-4">
                  <input type="hidden" name="suggestionId" value={suggestion.id} />
                  <select name="status" className="mb-3 w-full rounded-xl border p-3 text-sm" defaultValue="needs_more_info">
                    <option value="needs_more_info">Needs more info</option>
                    <option value="already_tracked">Already tracked</option>
                    <option value="rejected">Reject</option>
                  </select>
                  <textarea name="adminNotes" className="mb-3 min-h-20 w-full rounded-xl border p-3 text-sm" placeholder="Required admin notes" />
                  <button className="rounded-full border px-4 py-2 text-sm font-semibold">Save review</button>
                </form>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

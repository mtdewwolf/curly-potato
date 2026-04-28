"use client";

import { useTransition } from "react";
import { CheckCircle, EyeOff, XCircle } from "lucide-react";

import { publishPolicyChange, reviewPolicyChange } from "@/lib/actions/admin";

type Props = {
  changeId: string;
  defaultSummary?: string | null;
};

export function AdminReviewActions({ changeId, defaultSummary }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">Review decision</h3>
      <form
        action={(formData) =>
          startTransition(async () => {
            const action = String(formData.get("action"));
            if (action === "publish") await publishPolicyChange(formData);
            else await reviewPolicyChange(formData);
          })
        }
        className="mt-4 space-y-4"
      >
        <input type="hidden" name="change_id" value={changeId} />
        <label className="block text-sm font-medium text-slate-700" htmlFor="summary">
          Summary before publishing
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={5}
          defaultValue={defaultSummary ?? ""}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            disabled={pending}
            name="action"
            value="publish"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            <CheckCircle className="h-4 w-4" /> Publish
          </button>
          <button
            disabled={pending}
            name="action"
            value="rejected"
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
          <button
            disabled={pending}
            name="action"
            value="ignored"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <EyeOff className="h-4 w-4" /> Ignore as non-substantive
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { createPolicyDocumentAction } from "@/lib/actions/admin";
import { DOCUMENT_TYPES, SCAN_FREQUENCIES } from "@/lib/constants";

export function AdminPolicyDocumentForm({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState(createPolicyDocumentAction, { ok: false, message: "" });
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="serviceId" value={serviceId} />
      <h2 className="text-lg font-semibold text-slate-950">Add policy document</h2>
      <input className="rounded-2xl border border-slate-200 px-4 py-3" name="title" placeholder="Display title" />
      <select className="rounded-2xl border border-slate-200 px-4 py-3" name="documentType">
        {DOCUMENT_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <input className="rounded-2xl border border-slate-200 px-4 py-3" name="url" placeholder="https://example.com/privacy" required />
      <select className="rounded-2xl border border-slate-200 px-4 py-3" name="scanFrequency">
        {SCAN_FREQUENCIES.map((frequency) => (
          <option key={frequency}>{frequency}</option>
        ))}
      </select>
      {state?.message ? <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{state.message}</p> : null}
      <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" disabled={pending}>
        {pending ? "Adding..." : "Add document"}
      </button>
    </form>
  );
}

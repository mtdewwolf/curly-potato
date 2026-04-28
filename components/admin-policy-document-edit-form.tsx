"use client";

import { useActionState } from "react";
import { updatePolicyDocumentAction } from "@/lib/actions/admin";
import { DOCUMENT_TYPES, SCAN_FREQUENCIES } from "@/lib/constants";

type Props = {
  serviceId: string;
  document: {
    id: string;
    title: string | null;
    document_type: string;
    url: string;
    scan_frequency: string;
  };
};

export function AdminPolicyDocumentEditForm({ serviceId, document }: Props) {
  const [state, action, pending] = useActionState(updatePolicyDocumentAction, { ok: false, message: "" });

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="policyDocumentId" value={document.id} />
      <h2 className="text-lg font-semibold text-slate-950">Edit policy document</h2>
      <input className="rounded-2xl border border-slate-200 px-4 py-3" name="title" defaultValue={document.title ?? ""} />
      <select className="rounded-2xl border border-slate-200 px-4 py-3" name="documentType" defaultValue={document.document_type}>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      <input className="rounded-2xl border border-slate-200 px-4 py-3" name="url" defaultValue={document.url} required />
      <select className="rounded-2xl border border-slate-200 px-4 py-3" name="scanFrequency" defaultValue={document.scan_frequency}>
        {SCAN_FREQUENCIES.map((frequency) => (
          <option key={frequency}>{frequency}</option>
        ))}
      </select>
      {state?.message ? <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{state.message}</p> : null}
      <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" disabled={pending}>
        {pending ? "Saving..." : "Save document"}
      </button>
    </form>
  );
}

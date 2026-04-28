"use client";

import { useActionState } from "react";
import { createServiceAction } from "@/lib/actions/admin";
import { SERVICE_CATEGORIES, RISK_LEVELS } from "@/lib/constants";

export function AdminServiceForm() {
  const [state, action, pending] = useActionState(createServiceAction, { ok: false, message: "" });

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Create tracked service</h2>
      {state?.message ? <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{state.message}</p> : null}
      <input name="name" required placeholder="Company name" className="rounded-xl border border-slate-200 px-3 py-2" />
      <input name="websiteUrl" placeholder="https://example.com" className="rounded-xl border border-slate-200 px-3 py-2" />
      <textarea name="description" placeholder="Why this service is tracked" className="min-h-20 rounded-xl border border-slate-200 px-3 py-2" />
      <select name="category" className="rounded-xl border border-slate-200 px-3 py-2">
        {SERVICE_CATEGORIES.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <select name="overallRiskLevel" className="rounded-xl border border-slate-200 px-3 py-2">
        {RISK_LEVELS.map((level) => (
          <option key={level}>{level}</option>
        ))}
      </select>
      <button disabled={pending} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Creating..." : "Create service"}
      </button>
    </form>
  );
}

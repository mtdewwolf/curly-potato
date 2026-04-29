import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

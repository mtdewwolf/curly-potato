export function EvidenceBlock({ title = "Evidence", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <blockquote className="whitespace-pre-wrap border-l-4 border-slate-300 pl-4 text-sm text-slate-700">
        {children}
      </blockquote>
    </div>
  );
}

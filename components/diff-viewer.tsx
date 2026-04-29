import { diffLines } from "diff";
import { cn } from "@/lib/utils";

export function DiffViewer({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = diffLines(oldText || "", newText || "");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-sm text-slate-100">
      <div className="border-b border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        Snapshot diff
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-4 font-mono leading-relaxed">
        {parts.map((part, index) => (
          <span
            key={`${part.value.slice(0, 12)}-${index}`}
            className={cn(
              "block px-2",
              part.added && "bg-emerald-500/20 text-emerald-100",
              part.removed && "bg-red-500/20 text-red-100",
            )}
          >
            {part.value}
          </span>
        ))}
      </pre>
    </div>
  );
}

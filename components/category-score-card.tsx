import { RiskBadge } from "@/components/risk-badge";

type CategoryScoreCardProps = {
  category: string;
  severity: string;
  score?: number | null;
  explanation?: string | null;
  evidence?: string[] | null;
};

export function CategoryScoreCard({ category, severity, score, explanation, evidence }: CategoryScoreCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{category}</h3>
          {typeof score === "number" ? <p className="text-sm text-slate-500">Score {score}/10</p> : null}
        </div>
        <RiskBadge level={severity} />
      </div>
      {explanation ? <p className="mt-3 text-sm text-slate-600">{explanation}</p> : null}
      {evidence?.length ? (
        <ul className="mt-3 space-y-2 text-xs text-slate-500">
          {evidence.slice(0, 3).map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 p-3">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

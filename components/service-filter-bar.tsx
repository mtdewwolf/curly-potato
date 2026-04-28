import { CATEGORIES, DOCUMENT_TYPES, RISK_LEVELS } from "@/lib/constants";

export function ServiceFilterBar() {
  return (
    <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <input name="q" placeholder="Search services" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm md:col-span-2" />
      <select name="category" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
        <option value="">All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <select name="risk" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
        <option value="">All risks</option>
        {RISK_LEVELS.map((risk) => (
          <option key={risk}>{risk}</option>
        ))}
      </select>
      <select name="document_type" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
        <option value="">Document type</option>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
    </form>
  );
}

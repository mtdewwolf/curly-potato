"use client";

import { createSuggestion } from "@/lib/actions/user";
import { CATEGORIES } from "@/lib/constants";
import { SubmitButton } from "./submit-button";

export function SuggestionForm() {
  return (
    <form action={createSuggestion} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-semibold">Company name *</label>
        <input name="company_name" required className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Website URL</label>
          <input name="website_url" type="url" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
        </div>
        <div>
          <label className="text-sm font-semibold">Category</label>
          <select name="category" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3">
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Terms URL</label>
          <input name="terms_url" type="url" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
        </div>
        <div>
          <label className="text-sm font-semibold">Privacy Policy URL</label>
          <input name="privacy_url" type="url" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Reason this should be tracked *</label>
        <textarea name="reason" required rows={4} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <div>
        <label className="text-sm font-semibold">Notes</label>
        <textarea name="notes" rows={3} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <SubmitButton>Submit suggestion</SubmitButton>
    </form>
  );
}

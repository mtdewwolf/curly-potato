import Link from "next/link";
import { SuggestionForm } from "@/components/suggestion-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SuggestPage() {
  const { profile } = await getCurrentUser();

  if (!profile) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Sign in to suggest a service</h1>
        <p className="mt-3 text-slate-600">Suggestions are manually reviewed before any policy URL is added to the crawler.</p>
        <Link href="/auth/sign-in" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">Suggest</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Help expand the watchlist</h1>
        <p className="mt-4 text-slate-600">
          Submit companies or services that should be monitored. Admins decide whether to create tracked services and policy
          documents.
        </p>
      </section>
      <SuggestionForm />
    </div>
  );
}

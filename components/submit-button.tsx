"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
      {pending ? "Submitting..." : children}
    </button>
  );
}

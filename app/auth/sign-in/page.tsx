import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default function SignInPage() {
  async function signIn(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect("/auth/sign-in?error=invalid");
    }
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <form action={signIn} className="w-full rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Welcome back</p>
        <h1 className="mt-3 text-3xl font-bold">Sign in</h1>
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input name="email" type="email" required className="mt-2 w-full rounded-xl border px-3 py-2" />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input name="password" type="password" required className="mt-2 w-full rounded-xl border px-3 py-2" />
        <button className="mt-6 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Sign in
        </button>
        <p className="mt-4 text-sm text-slate-600">
          Need an account? <a className="font-semibold text-slate-950" href="/auth/sign-up">Create one</a>.
        </p>
      </form>
    </main>
  );
}

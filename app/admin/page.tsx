import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { profile } = await getCurrentUser();
  if (!profile || !["admin", "reviewer"].includes(profile.role)) redirect("/");
  const supabase = await createClient();
  const [suggestions, changes, scans, services] = await Promise.all([
    supabase.from("tracking_suggestions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("policy_changes").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("scan_logs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("tracked_services").select("id", { count: "exact", head: true }).eq("status", "active")
  ]);
  const cards = [
    ["Pending suggestions", suggestions.count ?? 0, "/admin/suggestions"],
    ["Pending policy changes", changes.count ?? 0, "/admin/policy-changes"],
    ["Failed scans", scans.count ?? 0, "/admin/scans"],
    ["Active services", services.count ?? 0, "/admin/services"]
  ];
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Admin overview</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href as string} className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

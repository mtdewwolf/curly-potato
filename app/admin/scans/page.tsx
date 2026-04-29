import { triggerDueScansAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminScansPage() {
  await requireRole(["admin"]);
  const supabase = createAdminClient();
  const { data: logs } = await supabase.from("scan_logs").select("*, policy_documents(title, document_type, tracked_services(name))").order("started_at", { ascending: false }).limit(50);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Admin</p>
          <h1 className="text-3xl font-bold text-slate-950">Scan logs</h1>
        </div>
        <form action={triggerDueScansAction}>
          <button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Scan due policies</button>
        </form>
      </div>
      <div className="grid gap-3">
        {logs?.map((log) => {
          const document = Array.isArray(log.policy_documents) ? log.policy_documents[0] : log.policy_documents;
          const service = Array.isArray(document?.tracked_services) ? document?.tracked_services[0] : document?.tracked_services;
          return (
            <article key={log.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-950">{service?.name ?? "Unknown service"} - {document?.document_type ?? "Policy"}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">{log.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{log.message}</p>
              {log.error ? <pre className="mt-3 overflow-auto rounded-2xl bg-red-50 p-3 text-xs text-red-800">{log.error}</pre> : null}
              <p className="mt-3 text-xs text-slate-500">Changed: {String(log.changed)} - Started: {log.started_at ? new Date(log.started_at).toLocaleString() : "unknown"}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

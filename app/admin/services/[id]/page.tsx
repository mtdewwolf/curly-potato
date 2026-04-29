import { notFound } from "next/navigation";
import { AdminPolicyDocumentEditForm } from "@/components/admin-policy-document-edit-form";
import { AdminPolicyDocumentForm } from "@/components/admin-policy-document-form";
import { requireRole } from "@/lib/auth";
import { archiveServiceAction, triggerPolicyScanAction, updateServiceAction } from "@/lib/actions/admin";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin"]);
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: service } = await supabase.from("tracked_services").select("*, policy_documents(*)").eq("id", id).single();
  if (!service) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Admin</p>
        <h1 className="text-3xl font-bold text-slate-950">{service.name}</h1>
      </div>
      <form action={updateServiceAction} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="serviceId" value={service.id} />
        <h2 className="text-lg font-semibold text-slate-950">Service settings</h2>
        <input className="rounded-2xl border border-slate-200 px-4 py-3" name="name" defaultValue={service.name} required />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" name="websiteUrl" defaultValue={service.website_url ?? ""} />
        <textarea className="rounded-2xl border border-slate-200 px-4 py-3" name="description" defaultValue={service.description ?? ""} />
        <select className="rounded-2xl border border-slate-200 px-4 py-3" name="category" defaultValue={service.category ?? "Other"}>
          {SERVICE_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <select className="rounded-2xl border border-slate-200 px-4 py-3" name="status" defaultValue={service.status}>
          {["active", "paused", "draft", "archived"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input className="rounded-2xl border border-slate-200 px-4 py-3" name="overallRiskLevel" defaultValue={service.overall_risk_level ?? "Moderate"} />
        <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Save service</button>
      </form>

      <AdminPolicyDocumentForm serviceId={service.id} />

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold text-slate-950">Policy documents</h2>
        {(service.policy_documents as any[] | undefined)?.map((document) => (
          <div key={document.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <AdminPolicyDocumentEditForm
              serviceId={service.id}
              document={{
                id: document.id,
                title: document.title,
                document_type: document.document_type,
                url: document.url,
                scan_frequency: document.scan_frequency,
              }}
            />
            <form action={triggerPolicyScanAction}>
              <input type="hidden" name="policyDocumentId" value={document.id} />
              <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">Trigger scan</button>
            </form>
          </div>
        ))}
      </div>

      <form action={archiveServiceAction}>
        <input type="hidden" name="serviceId" value={service.id} />
        <button className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Archive service</button>
      </form>
    </div>
  );
}

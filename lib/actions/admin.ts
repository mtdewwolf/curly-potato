"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { DOCUMENT_TYPES, SERVICE_CATEGORIES } from "@/lib/constants";
import { sendPolicyChangeEmail } from "@/lib/email";
import { scanDuePolicies, scanPolicyDocument } from "@/lib/jobs/scanner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSlug } from "@/lib/utils";

export type ActionState = { ok?: boolean; message?: string } | null;

const serviceSchema = z.object({
  name: z.string().min(2),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  category: z.enum(SERVICE_CATEGORIES).optional(),
  status: z.enum(["active", "paused", "draft", "archived"]).default("active"),
  overallRiskLevel: z.string().optional(),
});

const documentSchema = z.object({
  serviceId: z.string().uuid(),
  documentType: z.enum(DOCUMENT_TYPES),
  title: z.string().optional(),
  url: z.string().url(),
  scanFrequency: z.enum(["daily", "weekly", "monthly", "manual"]).default("daily"),
});

export async function createServiceAction(_: ActionState, formData: FormData) {
  const profile = await requireRole(["admin"]);
  const input = serviceSchema.parse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl") || "",
    description: formData.get("description") || "",
    category: formData.get("category") || undefined,
    status: formData.get("status") || "active",
    overallRiskLevel: formData.get("overallRiskLevel") || "Moderate",
  });
  const supabase = createAdminClient();
  const { data: service, error } = await supabase
    .from("tracked_services")
    .insert({
      name: input.name,
      slug: createSlug(input.name),
      website_url: input.websiteUrl || null,
      description: input.description || null,
      category: input.category,
      status: input.status,
      overall_risk_level: input.overallRiskLevel || "Moderate",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !service) return { ok: false, message: error?.message ?? "Service could not be created." };
  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect(`/admin/services/${service.id}`);
}

export async function updateServiceAction(formData: FormData) {
  await requireRole(["admin"]);
  const serviceId = z.string().uuid().parse(formData.get("serviceId"));
  const input = serviceSchema.parse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl") || "",
    description: formData.get("description") || "",
    category: formData.get("category") || undefined,
    status: formData.get("status") || "active",
    overallRiskLevel: formData.get("overallRiskLevel") || "Moderate",
  });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tracked_services")
    .update({
      name: input.name,
      slug: createSlug(input.name),
      website_url: input.websiteUrl || null,
      description: input.description || null,
      category: input.category,
      status: input.status,
      overall_risk_level: input.overallRiskLevel || "Moderate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/services");
}

export async function archiveServiceAction(formData: FormData) {
  await requireRole(["admin"]);
  const serviceId = z.string().uuid().parse(formData.get("serviceId"));
  const supabase = createAdminClient();
  const { error } = await supabase.from("tracked_services").update({ status: "archived" }).eq("id", serviceId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/services");
}

export async function createPolicyDocumentAction(_: ActionState, formData: FormData) {
  await requireRole(["admin"]);
  const input = documentSchema.parse({
    serviceId: formData.get("serviceId"),
    documentType: formData.get("documentType"),
    title: formData.get("title") || "",
    url: formData.get("url"),
    scanFrequency: formData.get("scanFrequency") || "daily",
  });
  const supabase = createAdminClient();
  const { error } = await supabase.from("policy_documents").insert({
    service_id: input.serviceId,
    document_type: input.documentType,
    title: input.title || input.documentType,
    url: input.url,
    scan_frequency: input.scanFrequency,
    status: "active",
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/admin/services/${input.serviceId}`);
  revalidatePath("/admin/services");
  return { ok: true, message: "Policy document added." };
}

export async function updatePolicyDocumentAction(_: ActionState, formData: FormData) {
  await requireRole(["admin"]);
  const policyDocumentId = z.string().uuid().parse(formData.get("policyDocumentId"));
  const serviceId = z.string().uuid().parse(formData.get("serviceId"));
  const input = documentSchema.omit({ serviceId: true }).parse({
    documentType: formData.get("documentType"),
    title: formData.get("title") || "",
    url: formData.get("url"),
    scanFrequency: formData.get("scanFrequency") || "daily",
  });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("policy_documents")
    .update({
      document_type: input.documentType,
      title: input.title || input.documentType,
      url: input.url,
      scan_frequency: input.scanFrequency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", policyDocumentId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/admin/services/${serviceId}`);
  return { ok: true, message: "Policy document updated." };
}

export async function createPolicyDocumentBoundAction(_: ActionState, formData: FormData) {
  return createPolicyDocumentAction({}, formData);
}

export async function reviewSuggestionAction(formData: FormData) {
  const profile = await requireRole(["admin", "reviewer"]);
  const suggestionId = z.string().uuid().parse(formData.get("suggestionId"));
  const status = z.enum(["rejected", "already_tracked", "needs_more_info"]).parse(formData.get("status"));
  const adminNotes = String(formData.get("adminNotes") || "");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("tracking_suggestions")
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", suggestionId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/suggestions");
}

export async function approveSuggestionAction(_: ActionState, formData: FormData) {
  const profile = await requireRole(["admin"]);
  const suggestionId = z.string().uuid().parse(formData.get("suggestionId"));
  const supabase = createAdminClient();
  const { data: suggestion, error: suggestionError } = await supabase
    .from("tracking_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .single();
  if (suggestionError || !suggestion) return { ok: false, message: suggestionError?.message ?? "Suggestion not found." };

  const { data: service, error: serviceError } = await supabase
    .from("tracked_services")
    .insert({
      name: suggestion.company_name,
      slug: createSlug(suggestion.company_name),
      website_url: suggestion.website_url,
      category: suggestion.category,
      description: suggestion.reason,
      status: "active",
      overall_risk_level: "Moderate",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (serviceError || !service) return { ok: false, message: serviceError?.message ?? "Could not create service." };

  const documents = [
    suggestion.terms_url ? { service_id: service.id, document_type: "Terms of Service", title: "Terms of Service", url: suggestion.terms_url } : null,
    suggestion.privacy_url ? { service_id: service.id, document_type: "Privacy Policy", title: "Privacy Policy", url: suggestion.privacy_url } : null,
  ].filter(Boolean);

  if (documents.length > 0) {
    const { error } = await supabase.from("policy_documents").insert(documents);
    if (error) return { ok: false, message: error.message };
  }

  const { error } = await supabase
    .from("tracking_suggestions")
    .update({
      status: "approved",
      admin_notes: String(formData.get("adminNotes") || "") || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      created_service_id: service.id,
    })
    .eq("id", suggestionId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/suggestions");
  revalidatePath("/admin/services");
  return { ok: true, message: "Suggestion approved and service created." };
}

export async function approveSuggestionFormAction(formData: FormData) {
  await approveSuggestionAction({}, formData);
}

export async function triggerPolicyScanAction(formData: FormData) {
  await requireRole(["admin"]);
  const policyDocumentId = z.string().uuid().parse(formData.get("policyDocumentId"));
  await scanPolicyDocument(policyDocumentId);
  revalidatePath("/admin/scans");
  revalidatePath("/admin/policy-changes");
}

export async function triggerDueScansAction() {
  await requireRole(["admin"]);
  await scanDuePolicies();
  revalidatePath("/admin/scans");
  revalidatePath("/admin/policy-changes");
}

export async function reviewPolicyChangeAction(formData: FormData) {
  const profile = await requireRole(["admin", "reviewer"]);
  const policyChangeId = z.string().uuid().parse(formData.get("policyChangeId"));
  const action = z.enum(["published", "rejected", "ignored"]).parse(formData.get("action"));
  const summary = String(formData.get("summary") || "");
  const supabase = createAdminClient();
  const { data: change, error } = await supabase
    .from("policy_changes")
    .update({
      status: action,
      change_summary: summary || undefined,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      published_at: action === "published" ? new Date().toISOString() : null,
    })
    .eq("id", policyChangeId)
    .select("*, policy_documents(document_type, tracked_services(id, name, slug))")
    .single();
  if (error) throw new Error(error.message);

  if (action === "published" && change?.policy_documents) {
    const service = Array.isArray(change.policy_documents.tracked_services)
      ? change.policy_documents.tracked_services[0]
      : change.policy_documents.tracked_services;
    const { data: subscriptions } = await supabase
      .from("user_service_subscriptions")
      .select("user_id, notify_email, profiles(email)")
      .eq("service_id", service.id);
    const title = `${service.name} updated its ${change.policy_documents.document_type}`;
    const message = `Risk impact: ${change.risk_impact_level ?? "Review"}. ${summary || change.change_summary || "A policy update was published."}`;
    if (subscriptions?.length) {
      await supabase.from("notifications").upsert(
        subscriptions.map((subscription) => ({
          user_id: subscription.user_id,
          service_id: service.id,
          policy_change_id: policyChangeId,
          title,
          message,
        })),
        { onConflict: "user_id,policy_change_id" },
      );
      await Promise.all(
        subscriptions
          .filter((subscription) => subscription.notify_email)
          .map(async (subscription) => {
            const profileRow = Array.isArray(subscription.profiles) ? subscription.profiles[0] : subscription.profiles;
            if (!profileRow?.email) return;
            const sent = await sendPolicyChangeEmail({
              to: profileRow.email,
              serviceName: service.name,
              documentType: change.policy_documents.document_type,
              riskLevel: change.risk_impact_level ?? "Review",
              summary: summary || change.change_summary || "A policy update was published.",
              reportUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/reports/${policyChangeId}`,
            });
            if (sent) {
              await supabase.from("notifications").update({ emailed_at: new Date().toISOString() }).eq("user_id", subscription.user_id).eq("policy_change_id", policyChangeId);
            }
          }),
      );
    }
  }

  revalidatePath("/admin/policy-changes");
  revalidatePath("/services");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const suggestionSchema = z.object({
  company_name: z.string().trim().min(2).max(160),
  website_url: z.string().trim().url().optional().or(z.literal("")),
  terms_url: z.string().trim().url().optional().or(z.literal("")),
  privacy_url: z.string().trim().url().optional().or(z.literal("")),
  category: z.enum(CATEGORIES).optional().or(z.literal("")),
  reason: z.string().trim().min(10).max(2000),
  notes: z.string().trim().max(2000).optional().or(z.literal(""))
});

function normalizeHost(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^www\./, "").trim();
  }
}

export async function createSuggestion(formData: FormData) {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/auth/sign-in");

  const parsed = suggestionSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sinceMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: dayCount }, { count: monthCount }] = await Promise.all([
    supabase.from("tracking_suggestions").select("id", { count: "exact", head: true }).eq("submitted_by", profile.id).gte("created_at", sinceDay),
    supabase.from("tracking_suggestions").select("id", { count: "exact", head: true }).eq("submitted_by", profile.id).gte("created_at", sinceMonth)
  ]);

  if ((dayCount ?? 0) >= 5 || (monthCount ?? 0) >= 20) {
    throw new Error("Suggestion limit reached. Please try again later.");
  }

  const domain = normalizeHost(parsed.website_url || parsed.terms_url || parsed.privacy_url);
  if (domain) {
    const { data: tracked } = await supabase.from("tracked_services").select("id,name,website_url").eq("status", "active");
    if (tracked?.some((service) => normalizeHost(service.website_url)?.endsWith(domain) || domain.endsWith(normalizeHost(service.website_url) ?? ""))) {
      throw new Error("This service appears to already be tracked.");
    }
  }

  const { data: pendingDuplicate } = await supabase
    .from("tracking_suggestions")
    .select("id")
    .eq("status", "pending")
    .ilike("company_name", parsed.company_name)
    .maybeSingle();

  if (pendingDuplicate) {
    throw new Error("A pending suggestion for this company already exists.");
  }

  const { error } = await supabase.from("tracking_suggestions").insert({
    submitted_by: profile.id,
    company_name: parsed.company_name,
    website_url: parsed.website_url || null,
    terms_url: parsed.terms_url || null,
    privacy_url: parsed.privacy_url || null,
    category: parsed.category || null,
    reason: parsed.reason,
    notes: parsed.notes || null
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createSuggestionAction(_: unknown, formData: FormData) {
  return createSuggestion(formData);
}

export async function followService(serviceId: string, serviceSlug: string) {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/auth/sign-in");
  const supabase = await createClient();
  const { error } = await supabase.from("user_service_subscriptions").insert({ user_id: profile.id, service_id: serviceId });
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath(`/service/${serviceSlug}`);
}

export async function unfollowService(serviceId: string, serviceSlug: string) {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/auth/sign-in");
  const supabase = await createClient();
  const { error } = await supabase.from("user_service_subscriptions").delete().eq("user_id", profile.id).eq("service_id", serviceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/service/${serviceSlug}`);
}

export async function toggleFollowService(serviceId: string, isFollowing: boolean, serviceSlug = "") {
  if (isFollowing) {
    await unfollowService(serviceId, serviceSlug);
  } else {
    await followService(serviceId, serviceSlug);
  }
}

export async function toggleFollowServiceForm(formData: FormData) {
  await toggleFollowService(String(formData.get("serviceId")), formData.get("isFollowing") === "true", String(formData.get("serviceSlug") ?? ""));
}

export async function markNotificationRead(formData: FormData) {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/auth/sign-in");
  const notificationId = String(formData.get("notificationId"));
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("user_id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateNotificationPreferences(formData: FormData) {
  const { profile } = await getCurrentUser();
  if (!profile) redirect("/auth/sign-in");
  const supabase = await createClient();
  const notifyEmail = formData.get("notify_email") === "on";
  const notifyInApp = formData.get("notify_in_app") === "on";
  const { error } = await supabase
    .from("user_service_subscriptions")
    .update({ notify_email: notifyEmail, notify_in_app: notifyInApp })
    .eq("user_id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserRole = "user" | "reviewer" | "admin";

export async function getCurrentProfile(supabase = createServerSupabaseClient()) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function requireUser() {
  const supabase = createServerSupabaseClient();
  const { user, profile } = await getCurrentProfile(supabase);
  if (!user) {
    redirect("/login");
  }
  return { supabase, user, profile };
}

export async function requireReviewer() {
  const session = await requireUser();
  const role = session.profile?.role;
  if (role !== "admin" && role !== "reviewer") {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile?.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

export async function isSubscribed(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
  serviceId: string,
) {
  if (!userId) return false;
  const { data } = await supabase
    .from("user_service_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("service_id", serviceId)
    .maybeSingle();
  return Boolean(data);
}

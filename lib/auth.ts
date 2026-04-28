import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "user" | "reviewer" | "admin";

export async function getCurrentProfile(supabase?: SupabaseClient<any>) {
  const client = supabase ?? (await createClient());
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export const getCurrentUser = getCurrentProfile;

export async function requireUser() {
  const supabase = await createClient();
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

export async function requireRole(roles: UserRole[]) {
  const session = await requireUser();
  if (!session.profile || !roles.includes(session.profile.role)) {
    redirect("/dashboard");
  }
  return session.profile;
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

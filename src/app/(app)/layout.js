import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }) {
  if (!getSupabaseEnv()) {
    redirect("/login?error=Supabase%20configuration%20is%20missing.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  let { data: organization } = await supabase
    .from("organizations")
    .select("id, name, default_low_stock_threshold")
    .eq("owner_id", user.id)
    .maybeSingle();

  // If organization was not created by database trigger, create it now for the authenticated user
  if (!organization) {
    const orgName =
      user.user_metadata?.organization_name ||
      (user.email ? `र{user.email.split("@")[0]}'s Workspace` : "StockFlow Workspace");

    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({
        owner_id: user.id,
        name: orgName,
      })
      .select("id, name, default_low_stock_threshold")
      .maybeSingle();

    organization = newOrg;
  }

  if (!organization) {
    redirect("/login?error=Organization%20could%20not%20be%20loaded.%20Please%20verify%20database%20permissions.");
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}

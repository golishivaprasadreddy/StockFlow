import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

function safeNextPath(value) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  if (!getSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login?error=Supabase%20is%20not%20configured.", requestUrl));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(nextPath, requestUrl));
  }

  return NextResponse.redirect(
    new URL("/login?error=Could%20not%20confirm%20your%20account.", requestUrl),
  );
}

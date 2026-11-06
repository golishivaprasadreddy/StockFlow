"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl, getSupabaseEnv } from "@/lib/supabase/env";

const signupSchema = z
  .object({
    organizationName: z.string().trim().min(1, "Organization name is required").max(120),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string().max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
  password: z.string().min(1, "Password is required"),
});

function localNextPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/dashboard";
  }

  return value;
}

function authRedirect(path, message) {
  redirect(`र{path}?error=र{encodeURIComponent(message)}`);
}

function signupErrorMessage(error) {
  const code = error?.code?.toLowerCase() ?? "";
  const message = error?.message?.toLowerCase() ?? "";

  if (
    error?.status === 429 ||
    code.includes("rate_limit") ||
    message.includes("rate limit") ||
    message.includes("security purposes")
  ) {
    return "Supabase email rate limit reached (free tier allows only 3 emails/hr). In your Supabase dashboard, go to Authentication > Providers > Email and turn OFF 'Confirm email', then try signing up again.";
  }

  if (
    message.includes("database error saving new user") ||
    message.includes("create_organization_for_new_user")
  ) {
    return "Account setup could not create its organization. Verify the database schema and organization trigger in Supabase.";
  }

  if (code === "user_already_exists" || message.includes("already registered") || message.includes("already exists")) {
    return "An account already exists for this email. Try signing in instead.";
  }

  return error?.message || "Could not create your account. Please try again.";
}

function loginErrorMessage(error) {
  const code = error?.code?.toLowerCase() ?? "";
  const message = error?.message?.toLowerCase() ?? "";

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "Email not confirmed. Check your inbox for the confirmation link, or disable 'Confirm email' in Supabase Authentication settings to log in immediately.";
  }

  if (error?.status === 429 || code.includes("rate_limit") || message.includes("rate limit")) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid grant")
  ) {
    return "Invalid email or password. Please check your credentials.";
  }

  return error?.message || "Email or password is incorrect.";
}

export async function signupAction(formData) {
  if (!getSupabaseEnv()) {
    authRedirect(
      "/signup",
      "Add your Supabase URL and publishable key to .env first.",
    );
  }

  const parsed = signupSchema.safeParse({
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    authRedirect("/signup", parsed.error.issues[0]?.message ?? "Check your details.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { organization_name: parsed.data.organizationName },
      emailRedirectTo: `र{getSiteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    authRedirect("/signup", signupErrorMessage(error));
  }

  // If email confirmation is disabled in Supabase, user is signed in immediately
  if (data?.session) {
    redirect("/dashboard");
  }

  // If user was created but email confirmation is pending
  if (data?.user) {
    redirect("/login?message=Account%20created.%20If%20email%20confirmation%20is%20enabled,%20please%20check%20your%20inbox.");
  }

  redirect("/login");
}

export async function loginAction(formData) {
  if (!getSupabaseEnv()) {
    authRedirect(
      "/login",
      "Add your Supabase URL and publishable key to .env first.",
    );
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const nextPath = localNextPath(formData.get("next"));

  if (!parsed.success) {
    authRedirect("/login", parsed.error.issues[0]?.message ?? "Check your details.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    authRedirect("/login", loginErrorMessage(error));
  }

  redirect(nextPath);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    authRedirect("/dashboard", "Could not sign out. Please try again.");
  }
  redirect("/login");
}

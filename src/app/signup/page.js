import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signupAction } from "@/lib/actions/auth";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  const configured = Boolean(getSupabaseEnv());

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link aria-label="StockFlow home" className="brand" href="/">
          <Image
            alt=""
            className="brand-image"
            height={30}
            priority
            src="/stockflow-mark.svg"
            width={30}
          />
          <span>StockFlow</span>
        </Link>
        <div className="auth-aside-copy">
          <h1>Start with a clearer view of your stock.</h1>
          <p>
            Set up your workspace and keep products, quantities, and low-stock
            items together.
          </p>
        </div>
        <span className="auth-aside-foot">Simple inventory, in one place.</span>
      </aside>

      <section className="auth-main">
        <div className="auth-form-wrap">
          <h2>Create your workspace</h2>
          <p className="auth-subtitle">
            Add your organization and owner account to get started.
          </p>
          {params.error ? <p className="notice notice-error">{params.error}</p> : null}
          {!configured ? (
            <p className="notice" style={{ marginBottom: 16 }}>
              Configure Supabase URL and publishable key locally to enable account creation.
            </p>
          ) : null}

          <form action={signupAction} className="auth-form">
            <div className="field">
              <label htmlFor="organizationName">Organization name</label>
              <input
                autoComplete="organization"
                className="input"
                disabled={!configured}
                id="organizationName"
                maxLength={120}
                name="organizationName"
                placeholder="Acme Supply Co."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                autoComplete="email"
                className="input"
                disabled={!configured}
                id="email"
                maxLength={254}
                name="email"
                placeholder="you@company.com"
                required
                type="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                autoComplete="new-password"
                className="input"
                disabled={!configured}
                id="password"
                maxLength={72}
                minLength={8}
                name="password"
                required
                type="password"
              />
              <p className="field-hint">Use at least 8 characters.</p>
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                autoComplete="new-password"
                className="input"
                disabled={!configured}
                id="confirmPassword"
                maxLength={72}
                minLength={8}
                name="confirmPassword"
                required
                type="password"
              />
            </div>
            <button className="button button-primary auth-submit" disabled={!configured}>
              Create account <ArrowRight aria-hidden="true" size={15} />
            </button>
          </form>
          <p className="auth-footnote">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

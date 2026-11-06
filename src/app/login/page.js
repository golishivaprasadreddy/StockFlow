import Link from "next/link";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { loginAction } from "@/lib/actions/auth";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const configured = Boolean(getSupabaseEnv());

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link aria-label="StockFlow home" className="brand" href="/">
          <span>StockFlow</span>
        </Link>
        <div className="auth-aside-copy">
          <h1>Know what you have. Keep business moving.</h1>
          <p>
            A clear, dependable place to manage the products that keep your
            business running.
          </p>
        </div>
        <span className="auth-aside-foot">Simple inventory, in one place.</span>
      </aside>

      <section className="auth-main">
        <div className="auth-form-wrap">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your StockFlow workspace.</p>

          {params.error ? <p className="notice notice-error">{params.error}</p> : null}
          {params.message ? (
            <p className="notice notice-success">{params.message}</p>
          ) : null}
          {!configured ? (
            <p className="notice" style={{ marginBottom: 16 }}>
              Configure Supabase URL and publishable key locally to enable sign in.
            </p>
          ) : null}

          <form action={loginAction} className="auth-form">
            <input name="next" type="hidden" value={params.next || "/dashboard"} />
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
                autoComplete="current-password"
                className="input"
                disabled={!configured}
                id="password"
                maxLength={72}
                name="password"
                required
                type="password"
              />
            </div>
            <AuthSubmitButton
              configured={configured}
              label="Sign in"
              pendingLabel="Signing in..."
            />
          </form>

          <p className="auth-footnote">
            New to StockFlow? <Link href="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

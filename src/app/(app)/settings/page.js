import { SlidersHorizontal } from "lucide-react";
import { updateSettingsAction } from "@/lib/actions/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: organization } = await supabase
    .from("organizations")
    .select("name, default_low_stock_threshold")
    .eq("owner_id", user.id)
    .single();

  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage preferences for {organization.name}.</p>
        </div>
      </div>

      {params.notice ? (
        <p aria-live="polite" className="notice notice-success" style={{ marginBottom: 16 }}>
          {params.notice}
        </p>
      ) : null}
      {params.error ? (
        <p aria-live="polite" className="notice notice-error" style={{ marginBottom: 16 }}>
          {params.error}
        </p>
      ) : null}

      <section aria-labelledby="stock-settings" className="card">
        <div className="card-header">
          <div>
            <h2 id="stock-settings">Inventory</h2>
            <p>Set the default behavior for stock monitoring.</p>
          </div>
          <SlidersHorizontal aria-hidden="true" color="#737b88" size={17} />
        </div>
        <form action={updateSettingsAction} className="card-body">
          <div className="field" style={{ maxWidth: 360 }}>
            <label htmlFor="default_low_stock_threshold">
              Default low-stock threshold
            </label>
            <input
              className="input"
              defaultValue={organization.default_low_stock_threshold}
              id="default_low_stock_threshold"
              min="0"
              name="default_low_stock_threshold"
              required
              step="1"
              type="number"
            />
            <p className="field-hint">
              Products without an individual threshold use this value. Products
              with a quantity at or below the threshold are flagged as low stock.
            </p>
          </div>
          <div className="form-footer">
            <button className="button button-primary" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

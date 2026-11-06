import { AlertTriangle, ArrowRight, Boxes, Package } from "lucide-react";
import Link from "next/link";
import { isLowStock, getProducts } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, default_low_stock_threshold")
    .eq("owner_id", user.id)
    .single();
  const { data: products, error } = await getProducts(
    supabase,
    organization.id,
  );

  if (error) {
    return (
      <main className="main-content">
        <div className="notice notice-error">
          Inventory could not be loaded. Please refresh the page.
        </div>
      </main>
    );
  }

  const lowStock = products.filter((product) =>
    isLowStock(product, organization.default_low_stock_threshold),
  );
  const totalUnits = products.reduce(
    (total, product) => total + product.quantity_on_hand,
    0,
  );

  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <h1>Overview</h1>
          <p>A current view of your inventory.</p>
        </div>
        <Link className="button button-primary" href="/products/new">
          <Package aria-hidden="true" size={15} />
          Add product
        </Link>
      </div>

      <section aria-label="Inventory summary" className="stat-grid">
        <article className="card stat-card">
          <span className="stat-card-label">Total products </span>
          <strong className="stat-card-value"> {products.length} </strong>
          <span className="stat-card-foot"> Products in this workspace</span>
        </article>
        <article className="card stat-card">
          <span className="stat-card-label">Units on hand </span>
          <strong className="stat-card-value">
             {new Intl.NumberFormat("en-US").format(totalUnits)}  
          </strong>
          <span className="stat-card-foot">  Across all products </span>
        </article>
        <article className="card stat-card">
          <span className="stat-card-label">Low stock</span>
          <strong className="stat-card-value"> {lowStock.length} </strong>
          <span className="stat-card-foot">At or below their threshold</span>
        </article>
      </section>

      <section aria-labelledby="low-stock-heading" className="card">
        <div className="card-header">
          <div>
            <h2 id="low-stock-heading">Low stock items</h2>
            <p>Products at or below their stock threshold.</p>
          </div>
          {lowStock.length > 0 ? (
            <span className="badge badge-warning">
              <AlertTriangle aria-hidden="true" size={12} />
               {lowStock.length} {lowStock.length === 1 ? "item" : "items"}
            </span>
          ) : null}
        </div>
        {lowStock.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Boxes aria-hidden="true" size={18} />
            </span>
            <h3>Nothing needs attention</h3>
            <p>
              Low-stock products will appear here when their quantity reaches
              the configured threshold.
            </p>
            {products.length === 0 ? (
              <Link className="button button-secondary button-small" href="/products/new">
                Add your first product
                <ArrowRight aria-hidden="true" size={13} />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Threshold</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 8).map((product) => (
                  <tr key={product.id}>
                    <td className="table-primary">{product.name}</td>
                    <td className="mono">{product.sku}</td>
                    <td>
                      <span className="badge badge-warning">
                        {product.quantity_on_hand}
                      </span>
                    </td>
                    <td>
                      {product.low_stock_threshold ??
                        organization.default_low_stock_threshold}
                    </td>
                    <td>
                      <Link
                        aria-label={`Edit र{product.name}`}
                        className="inline-link"
                        href={`/products/र{product.id}/edit`}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

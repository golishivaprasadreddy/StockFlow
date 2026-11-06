import { Boxes, Download, Info, Plus, Search, Upload, X } from "lucide-react";
import Link from "next/link";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { StockAdjuster } from "@/components/products/stock-adjuster";
import { importProductsAction } from "@/lib/actions/products";
import { isLowStock, getProducts } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const search = String(params.search ?? "").trim().slice(0, 100);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, default_low_stock_threshold")
    .eq("owner_id", user.id)
    .single();
  const { data: allProducts, error } = await getProducts(
    supabase,
    organization.id,
  );

  if (error) {
    return (
      <main className="main-content">
        <div className="notice notice-error">
          Products could not be loaded. Please refresh the page.
        </div>
      </main>
    );
  }

  const products = search
    ? allProducts.filter((product) => {
        const needle = search.toLocaleLowerCase();
        return (
          product.name.toLocaleLowerCase().includes(needle) ||
          product.sku.toLocaleLowerCase().includes(needle)
        );
      })
    : allProducts;

  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <h1>Products</h1>
          <p>Manage your catalog and quantities on hand.</p>
        </div>
        <Link className="button button-primary" href="/products/new">
          <Plus aria-hidden="true" size={15} />
          Add product
        </Link>
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
      {params.importError ? (
        <p aria-live="polite" className="notice notice-error" style={{ marginBottom: 16 }}>
          {params.importError}
        </p>
      ) : null}

      <section aria-label="Product catalog" className="card">
        <div className="toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <strong style={{ fontSize: 12, fontWeight: 600 }}>
                Product catalog
              </strong>
            </div>
            {search ? (
              <Link
                className="button button-secondary button-small"
                href="/products"
                style={{ height: 26, minHeight: 26, fontSize: 11, padding: "0 8px", gap: 4 }}
              >
                <X aria-hidden="true" size={12} />
                Clear search
              </Link>
            ) : null}
          </div>
          <div className="catalog-tools">
            <form action="/products" className="search-form" role="search">
              <Search aria-hidden="true" color="#8a909c" size={15} />
              <input
                aria-label="Search products by name or SKU"
                className="input"
                defaultValue={search}
                maxLength={100}
                name="search"
                placeholder="Search name or SKU"
              />
            </form>
            <form action={importProductsAction} className="csv-import-form">
              <label className="sr-only" htmlFor="products-csv">
                Choose a products CSV file
              </label>
              <input
                accept=".csv,text/csv"
                className="csv-file-input"
                id="products-csv"
                name="file"
                required
                type="file"
              />
              <button className="button button-secondary button-small" type="submit">
                <Upload aria-hidden="true" size={13} />
                Import CSV
              </button>
            </form>
            <Link
              className="button button-secondary button-small csv-export"
              href="/products/export"
            >
              <Download aria-hidden="true" size={13} />
              Download CSV
            </Link>
          </div>
          <p className="csv-format-note" role="note">
            <Info aria-hidden="true" size={15} />
            <span>
              For uploads, use this CSV format. Download a file here and follow its column format.
            </span>
          </p>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Boxes aria-hidden="true" size={18} />
            </span>
            <h3>{search ? "No products match that search" : "Your catalog is empty"}</h3>
            <p>
              {search
                ? "Try another product name or SKU."
                : "Add a product to start keeping track of your inventory."}
            </p>
            {!search ? (
              <Link className="button button-primary button-small" href="/products/new">
                <Plus aria-hidden="true" size={13} />
                Add your first product
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
                  <th scope="col">Status</th>
                  <th scope="col">Selling price</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const low = isLowStock(
                    product,
                    organization.default_low_stock_threshold,
                  );
                  return (
                    <tr key={product.id}>
                      <td>
                        <Link
                          className="table-primary inline-link"
                          href={`/products/र{product.id}/edit`}
                        >
                          {product.name}
                        </Link>
                        {product.description ? (
                          <span className="table-secondary">
                            {product.description}
                          </span>
                        ) : null}
                      </td>
                      <td className="mono">{product.sku}</td>
                      <td>
                        <StockAdjuster id={product.id} quantity={product.quantity_on_hand} />
                      </td>
                      <td>
                        <span className={`badge र{low ? "badge-warning" : "badge-success"}`}>
                          {low ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td>{formatCurrency(product.selling_price)}</td>
                      <td>
                        <span className="inline-actions">
                          <Link
                            className="button button-secondary button-small"
                            href={`/products/र{product.id}/edit`}
                          >
                            Edit
                          </Link>
                          <DeleteProductButton id={product.id} name={product.name} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

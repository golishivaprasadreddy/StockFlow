import Link from "next/link";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/actions/products";

export function ProductForm({ product, error }) {
  const action = product ? updateProductAction : createProductAction;

  return (
    <form action={action} className="card">
      <div className="card-header">
        <div>
          <h2>{product ? "Product details" : "Product details"}</h2>
          <p>Fields marked with * are required.</p>
        </div>
      </div>
      <div className="card-body">
        {error ? (
          <p aria-live="polite" className="notice notice-error" style={{ marginBottom: 18 }}>
            {error}
          </p>
        ) : null}
        {product ? <input name="id" type="hidden" value={product.id} /> : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Product name *</label>
            <input
              autoComplete="off"
              className="input"
              defaultValue={product?.name ?? ""}
              id="name"
              maxLength={160}
              name="name"
              placeholder="e.g. Cotton tote bag"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sku">SKU *</label>
            <input
              autoComplete="off"
              className="input"
              defaultValue={product?.sku ?? ""}
              id="sku"
              maxLength={80}
              name="sku"
              placeholder="e.g. BAG-001"
              required
            />
          </div>
          <div className="field field-full">
            <label htmlFor="description">Description</label>
            <textarea
              className="textarea"
              defaultValue={product?.description ?? ""}
              id="description"
              maxLength={2000}
              name="description"
              placeholder="Optional notes about this product"
            />
          </div>
          <div className="field">
            <label htmlFor="quantity_on_hand">Quantity on hand *</label>
            <input
              className="input"
              defaultValue={product?.quantity_on_hand ?? 0}
              id="quantity_on_hand"
              max="2147483647"
              min="0"
              name="quantity_on_hand"
              required
              step="1"
              type="number"
            />
          </div>
          <div className="field">
            <label htmlFor="low_stock_threshold">Low stock threshold</label>
            <input
              className="input"
              defaultValue={product?.low_stock_threshold ?? ""}
              id="low_stock_threshold"
              max="2147483647"
              min="0"
              name="low_stock_threshold"
              placeholder="Use organization default"
              step="1"
              type="number"
            />
            <p className="field-hint">
              Leave blank to use the default set in Settings.
            </p>
          </div>
          <div className="field">
            <label htmlFor="cost_price">Cost price</label>
            <input
              className="input"
              defaultValue={product?.cost_price ?? ""}
              id="cost_price"
              max="9999999999.99"
              min="0"
              name="cost_price"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </div>
          <div className="field">
            <label htmlFor="selling_price">Selling price</label>
            <input
              className="input"
              defaultValue={product?.selling_price ?? ""}
              id="selling_price"
              max="9999999999.99"
              min="0"
              name="selling_price"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </div>
        </div>
        <div className="form-footer">
          <Link className="button button-secondary" href="/products">
            Cancel
          </Link>
          <button className="button button-primary" type="submit">
            {product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </form>
  );
}

export async function getProducts(supabase, organizationId) {
  const pageSize = 1000;
  const products = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, organization_id, name, sku, description, quantity_on_hand, cost_price, selling_price, low_stock_threshold, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .order("name")
      .range(from, from + pageSize - 1);

    if (error) return { data: null, error };
    products.push(...data);
    if (data.length < pageSize) break;
  }

  return { data: products, error: null };
}

export function isLowStock(product, defaultThreshold) {
  return (
    product.quantity_on_hand <=
    (product.low_stock_threshold ?? defaultThreshold)
  );
}

import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/products/product-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error || !product) notFound();

  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <Link className="back-link" href="/products">
            <ChevronLeft aria-hidden="true" size={14} />
            Products
          </Link>
          <h1 style={{ marginTop: 10 }}>Edit product</h1>
          <p>Update details and quantity for {product.name}.</p>
        </div>
      </div>
      <ProductForm error={query.error} product={product} />
    </main>
  );
}

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/products/product-form";

export const metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className="main-content">
      <div className="page-heading">
        <div>
          <Link className="back-link" href="/products">
            <ChevronLeft aria-hidden="true" size={14} />
            Products
          </Link>
          <h1 style={{ marginTop: 10 }}>Add product</h1>
          <p>Add a product to your organization’s catalog.</p>
        </div>
      </div>
      <ProductForm error={params.error} />
    </main>
  );
}

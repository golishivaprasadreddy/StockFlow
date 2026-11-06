import { redirect } from "next/navigation";

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  redirect(`/products/र{encodeURIComponent(id)}/edit`);
}

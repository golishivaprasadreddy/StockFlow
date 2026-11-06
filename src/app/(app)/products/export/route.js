import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data";
import { serializeProductsCsv } from "@/lib/products-csv.js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/products/export");
    return NextResponse.redirect(loginUrl);
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (organizationError || !organization) {
    return new NextResponse("Your organization could not be found.", {
      status: 404,
    });
  }

  const { data: products, error } = await getProducts(
    supabase,
    organization.id,
  );
  if (error) {
    return new NextResponse("Products could not be exported.", {
      status: 500,
    });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(serializeProductsCsv(products), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stockflow-products-${date}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

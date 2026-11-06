"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseProductsCsv,
  PRODUCT_CSV_MAX_BYTES,
} from "@/lib/products-csv.js";
import { productSchema } from "@/lib/product-validation.js";

function productRedirect(path, error) {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

async function getOwnerOrganization(supabase) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) productRedirect("/login", "Please sign in again.");

  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error || !organization) {
    productRedirect("/dashboard", "Your organization could not be found.");
  }

  return organization;
}

function parseProduct(formData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    quantity_on_hand: formData.get("quantity_on_hand"),
    cost_price: formData.get("cost_price"),
    selling_price: formData.get("selling_price"),
    low_stock_threshold: formData.get("low_stock_threshold"),
  });
}

function productErrorMessage(error) {
  if (error?.code === "23505") return "That SKU is already in use.";
  return "Could not save this product. Please try again.";
}

function importRedirect(message, success = false) {
  const key = success ? "notice" : "importError";
  redirect(`/products?${key}=${encodeURIComponent(message)}`);
}

export async function importProductsAction(formData) {
  const supabase = await createSupabaseServerClient();
  const organization = await getOwnerOrganization(supabase);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    importRedirect("Choose a CSV file to import.");
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    importRedirect("Choose a file with the .csv extension.");
  }
  if (file.size > PRODUCT_CSV_MAX_BYTES) {
    importRedirect("CSV files must be 2 MB or smaller.");
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer(),
    );
  } catch {
    importRedirect("The CSV file must use UTF-8 text encoding.");
  }

  let products;
  try {
    products = parseProductsCsv(text);
  } catch (error) {
    importRedirect(
      error instanceof Error ? error.message : "The CSV file could not be read.",
    );
  }

  const { error } = await supabase.from("products").insert(
    products.map((product) => ({
      ...product,
      organization_id: organization.id,
    })),
  );

  if (error?.code === "23505") {
    importRedirect(
      "An SKU in this file already exists in your catalog. No products were imported.",
    );
  }
  if (error) {
    importRedirect("Could not import products. No products were imported.");
  }

  importRedirect(`Imported ${products.length} products.`, true);
}

export async function createProductAction(formData) {
  const parsed = parseProduct(formData);
  if (!parsed.success) {
    productRedirect("/products/new", parsed.error.issues[0]?.message ?? "Check the product details.");
  }

  const supabase = await createSupabaseServerClient();
  const organization = await getOwnerOrganization(supabase);
  const { error } = await supabase.from("products").insert({
    ...parsed.data,
    organization_id: organization.id,
  });

  if (error) productRedirect("/products/new", productErrorMessage(error));
  redirect("/products?notice=Product%20created.");
}

export async function updateProductAction(formData) {
  const id = String(formData.get("id") ?? "");
  const parsed = parseProduct(formData);
  if (!id) productRedirect("/products", "Product not found.");
  if (!parsed.success) {
    productRedirect(`/products/${encodeURIComponent(id)}/edit`, parsed.error.issues[0]?.message ?? "Check the product details.");
  }

  const supabase = await createSupabaseServerClient();
  const organization = await getOwnerOrganization(supabase);
  const { data, error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", organization.id)
    .select("id")
    .maybeSingle();

  if (error) {
    productRedirect(
      `/products/${encodeURIComponent(id)}/edit`,
      productErrorMessage(error),
    );
  }
  if (!data) productRedirect("/products", "Product not found.");
  redirect("/products?notice=Product%20updated.");
}

export async function adjustStockAction(formData) {
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);

  if (!id || Number.isNaN(delta)) {
    productRedirect("/products", "Invalid stock adjustment.");
  }

  const supabase = await createSupabaseServerClient();
  const organization = await getOwnerOrganization(supabase);

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, quantity_on_hand")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .single();

  if (fetchError || !product) {
    productRedirect("/products", "Product not found.");
  }

  const newQuantity = Math.max(0, product.quantity_on_hand + delta);

  const { error: updateError } = await supabase
    .from("products")
    .update({ quantity_on_hand: newQuantity })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (updateError) {
    productRedirect("/products", "Could not adjust stock.");
  }

  redirect("/products?notice=Stock%20level%20updated.");
}

export async function deleteProductAction(formData) {
  const id = String(formData.get("id") ?? "");
  if (!id) productRedirect("/products", "Product not found.");

  const supabase = await createSupabaseServerClient();
  const organization = await getOwnerOrganization(supabase);
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id)
    .select("id")
    .maybeSingle();

  if (error) productRedirect("/products", "Could not delete this product.");
  if (!data) productRedirect("/products", "Product not found.");
  redirect("/products?notice=Product%20deleted.");
}

export async function updateSettingsAction(formData) {
  const parsed = z.preprocess(
    (value) => (value === "" || value == null ? Number.NaN : Number(value)),
    z.number().int().min(0).max(100000),
  ).safeParse(formData.get("default_low_stock_threshold"));

  if (!parsed.success) {
    productRedirect("/settings", "Enter a whole number between 0 and 100000.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) productRedirect("/login", "Please sign in again.");

  const { error } = await supabase
    .from("organizations")
    .update({ default_low_stock_threshold: parsed.data })
    .eq("owner_id", user.id);

  if (error) productRedirect("/settings", "Could not save the organization settings.");
  redirect("/settings?notice=Settings%20saved.");
}

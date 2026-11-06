import { z } from "zod";

const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z.number().finite().min(0).max(9999999999.99).nullable(),
);

const optionalThreshold = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z.number().int().min(0).max(2147483647).nullable(),
);

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(160),
  sku: z.string().trim().min(1, "SKU is required").max(80),
  description: z.string().trim().max(2000).transform((value) => value || null),
  quantity_on_hand: z.preprocess(
    (value) => (value === "" || value == null ? Number.NaN : Number(value)),
    z.number().int().min(0, "Quantity must be 0 or higher").max(2147483647),
  ),
  cost_price: optionalMoney,
  selling_price: optionalMoney,
  low_stock_threshold: optionalThreshold,
});

"use client";

import { Minus, Plus } from "lucide-react";
import { adjustStockAction } from "@/lib/actions/products";

export function StockAdjuster({ id, quantity }) {
  return (
    <div className="inline-flex items-center gap-1.5" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <form action={adjustStockAction} style={{ display: "inline" }}>
        <input name="id" type="hidden" value={id} />
        <input name="delta" type="hidden" value="-1" />
        <button
          aria-label="Decrease stock by 1"
          className="button button-secondary button-small"
          disabled={quantity <= 0}
          style={{ width: 24, height: 24, minHeight: 24, padding: 0 }}
          title="Decrease stock by 1"
          type="submit"
        >
          <Minus aria-hidden="true" size={12} />
        </button>
      </form>

      <span className="mono" style={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>
        {quantity}
      </span>

      <form action={adjustStockAction} style={{ display: "inline" }}>
        <input name="id" type="hidden" value={id} />
        <input name="delta" type="hidden" value="1" />
        <button
          aria-label="Increase stock by 1"
          className="button button-secondary button-small"
          style={{ width: 24, height: 24, minHeight: 24, padding: 0 }}
          title="Increase stock by 1"
          type="submit"
        >
          <Plus aria-hidden="true" size={12} />
        </button>
      </form>
    </div>
  );
}

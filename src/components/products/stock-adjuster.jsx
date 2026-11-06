"use client";

import { LoaderCircle, Minus, Plus } from "lucide-react";
import { useFormStatus } from "react-dom";
import { adjustStockAction } from "@/lib/actions/products";

function StockButton({ children, disabled = false, label }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      aria-label={label}
      className="button button-secondary button-small"
      disabled={disabled || pending}
      style={{ width: 28, height: 28, minHeight: 28, padding: 0 }}
      title={label}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="auth-spinner" size={13} />
      ) : (
        children
      )}
    </button>
  );
}

export function StockAdjuster({ id, quantity }) {
  return (
    <div className="inline-flex items-center gap-1.5" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <form action={adjustStockAction} style={{ display: "inline" }}>
        <input name="id" type="hidden" value={id} />
        <input name="delta" type="hidden" value="-1" />
        <StockButton disabled={quantity <= 0} label="Decrease stock by 1">
          <Minus aria-hidden="true" size={12} />
        </StockButton>
      </form>

      <span className="mono" style={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>
        {quantity}
      </span>

      <form action={adjustStockAction} style={{ display: "inline" }}>
        <input name="id" type="hidden" value={id} />
        <input name="delta" type="hidden" value="1" />
        <StockButton label="Increase stock by 1">
          <Plus aria-hidden="true" size={12} />
        </StockButton>
      </form>
    </div>
  );
}

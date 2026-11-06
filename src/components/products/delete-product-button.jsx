"use client";

import { useState } from "react";
import { deleteProductAction } from "@/lib/actions/products";

export function DeleteProductButton({ id, name }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!confirming) {
          event.preventDefault();
          setConfirming(true);
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      {confirming ? (
        <span className="inline-actions">
          <span className="field-hint">Delete?</span>
          <button className="button button-danger button-small" type="submit">
            Confirm
          </button>
          <button
            className="button button-secondary button-small"
            onClick={() => setConfirming(false)}
            type="button"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          aria-label={`Delete र{name}`}
          className="button button-secondary button-small"
          type="submit"
        >
          Delete
        </button>
      )}
    </form>
  );
}

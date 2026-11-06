"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function AuthSubmitButton({ configured, label, pendingLabel }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="button button-primary auth-submit"
      disabled={!configured || pending}
      type="submit"
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="auth-spinner" size={15} />
          {pendingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight aria-hidden="true" size={15} />
        </>
      )}
    </button>
  );
}

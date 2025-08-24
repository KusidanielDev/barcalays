// FILE: src/app/admin/components/Buttons.tsx
"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

function classes({
  variant,
  size,
  pending,
  extra,
}: {
  variant: Variant;
  size: Size;
  pending: boolean;
  extra?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed " +
    (pending ? "opacity-60 cursor-not-allowed " : "");

  const byVariant: Record<Variant, string> = {
    primary:
      "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600",
    secondary:
      "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400",
    danger:
      "bg-white text-red-700 border-red-300 hover:bg-red-50 focus-visible:ring-red-500",
    ghost:
      "bg-transparent text-gray-700 border-transparent hover:bg-gray-50 focus-visible:ring-gray-300",
  };

  const bySize: Record<Size, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-3.5 py-2 text-sm",
  };

  return [base, byVariant[variant], bySize[size], extra || ""].join(" ");
}

export function SubmitButton({
  children = "Save",
  className = "",
  variant = "secondary",
  size = "md",
  leadingIcon,
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  leadingIcon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      data-pending={pending ? "true" : "false"}
      className={classes({ variant, size, pending, extra: className })}
    >
      {pending ? <Spinner /> : leadingIcon ?? null}
      {children}
    </button>
  );
}

export function ConfirmSubmit({
  children = "Delete",
  confirmMessage = "This action is permanent and cannot be undone. Continue?",
  className = "",
  size = "md",
  variant = "danger",
  leadingIcon,
}: {
  children?: React.ReactNode;
  confirmMessage?: string;
  className?: string;
  size?: Size;
  variant?: Variant; // usually "danger"
  leadingIcon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pending) return;
    if (!window.confirm(confirmMessage)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending}
      data-pending={pending ? "true" : "false"}
      className={classes({ variant, size, pending, extra: className })}
    >
      {pending ? <Spinner /> : leadingIcon ?? null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  );
}

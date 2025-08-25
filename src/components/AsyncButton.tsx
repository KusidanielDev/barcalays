// FILE: src/components/AsyncButton.tsx
"use client";

import * as React from "react";

export default function AsyncButton({
  children,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = React.useState(false);

  return (
    <button
      type="submit"
      onClick={() => setBusy(true)}
      disabled={busy}
      className={`${className} ${busy ? "opacity-60" : ""}`}
    >
      {busy ? "Processing…" : children}
    </button>
  );
}

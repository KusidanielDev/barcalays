// FILE: src/app/admin/AdminOtpCell.tsx
"use client";

import { useState } from "react";

export default function AdminOtpCell({ otp }: { otp: string | null }) {
  const [show, setShow] = useState(false);
  const code = otp ?? "";

  if (!code) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <code className="px-1.5 py-0.5 rounded bg-gray-100">
        {show ? code : "••••••"}
      </code>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="border px-2 py-0.5 rounded text-xs"
        aria-label={show ? "Hide OTP" : "Reveal OTP"}
      >
        {show ? "Hide" : "Reveal"}
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
          } catch {}
        }}
        className="border px-2 py-0.5 rounded text-xs"
      >
        Copy
      </button>
    </div>
  );
}

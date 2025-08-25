// FILE: src/components/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function LogoutButton({
  to = "/login", // send users to your real login page
  className = "btn-secondary ml-1",
  label = "Logout",
}: {
  to?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      aria-busy={busy}
      disabled={busy}
      className={`${className} ${busy ? "opacity-60" : ""}`}
      onClick={async () => {
        setBusy(true);
        try {
          // Avoid server redirect; navigate on the client to a known-good route
          const res = await signOut({ redirect: false, callbackUrl: to });
          router.replace(res?.url || to);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Signing out…" : label}
    </button>
  );
}

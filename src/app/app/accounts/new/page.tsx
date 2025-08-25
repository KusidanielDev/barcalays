// FILE: src/app/app/accounts/new/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OpenAccountPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const preset = (sp.get("preset") || "").toUpperCase();

  const [name, setName] = React.useState(
    preset === "INVESTMENT" ? "Investment Account" : "Everyday Account"
  );
  const [type, setType] = React.useState<"CURRENT" | "SAVINGS" | "INVESTMENT">(
    ["CURRENT", "SAVINGS", "INVESTMENT"].includes(preset)
      ? (preset as any)
      : "CURRENT"
  );
  const [initial, setInitial] = React.useState("0");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch("/api/accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          initialDepositPence: Math.round(Number(initial || "0") * 100),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to open account");
      setOk("Account created");
      router.push("/app");
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-barclays-navy">
        Open new account
      </h1>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <div>
          <label className="text-sm text-gray-600">Account type</label>
          <select
            className="mt-1 w-full rounded border px-2 py-1.5"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="CURRENT">Current account</option>
            <option value="SAVINGS">Savings account</option>
            <option value="INVESTMENT">Investment account</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Account name</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Everyday Account"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Initial deposit (£)</label>
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded border px-3 py-2"
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            For investment accounts, this becomes your investing cash.
          </p>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {ok && <div className="text-sm text-green-700">{ok}</div>}

        <button
          type="submit"
          disabled={busy}
          className={`btn-primary ${busy ? "opacity-60" : ""}`}
        >
          {busy ? "Opening…" : "Open account"}
        </button>
      </form>
    </div>
  );
}

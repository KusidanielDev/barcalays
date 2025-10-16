// FILE: src/app/app/accounts/new/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { currencySymbol } from "@/lib/format";

export default function OpenAccountPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const preset = (sp.get("preset") || "").toUpperCase();

  const [name, setName] = React.useState(
    preset === "INVESTMENT" ? "Investment Account" : "Everyday Account"
  );
  const [type, setType] = React.useState<"CURRENT" | "SAVINGS" | "INVESTMENT">(
    (["CURRENT", "SAVINGS", "INVESTMENT"].includes(preset)
      ? preset
      : "CURRENT") as "CURRENT" | "SAVINGS" | "INVESTMENT"
  );
  const [currency, setCurrency] = React.useState<"GBP" | "INR" | "USD">("GBP");
  const [initialMajor, setInitialMajor] = React.useState<number>(0);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const sym = currencySymbol(currency);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          currency,
          initialDepositMajor: Number.isFinite(initialMajor) ? initialMajor : 0,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setOk("Account opened!");
      setTimeout(() => router.push(`/app/accounts/${j.accountId}`), 600);
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-barclays-navy mb-4">
        Open new account
      </h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Everyday Account"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="input"
          >
            <option value="CURRENT">Current</option>
            <option value="SAVINGS">Savings</option>
            <option value="INVESTMENT">Investment</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="input"
          >
            <option value="GBP">GBP – British Pound (£)</option>
            <option value="INR">INR – Indian Rupee (₹)</option>
            <option value="USD">USD – US Dollar ($)</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-700">Initial deposit ({sym})</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={initialMajor}
            onChange={(e) => setInitialMajor(parseFloat(e.target.value))}
            className="input"
            placeholder={`0.00`}
          />
        </label>

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

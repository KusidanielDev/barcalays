// FILE: src/app/app/accounts/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"CURRENT" | "SAVINGS" | "INVESTMENT">(
    "CURRENT"
  );
  const [currency, setCurrency] = useState("GBP");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || `${type} Account`, type, currency }),
    });
    setPending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Could not create account");
      return;
    }
    // Send the user to proper destination
    if (type === "INVESTMENT") router.push("/app/invest");
    else router.push("/app/accounts");
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#00395d]">
        Open a new account
      </h1>
      <form
        onSubmit={submit}
        className="mt-4 space-y-4 rounded-2xl border bg-white p-4"
      >
        <div>
          <label className="block text-sm text-gray-700">Account type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="CURRENT">Current</option>
            <option value="SAVINGS">Savings</option>
            <option value="INVESTMENT">Investment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${type} Account`}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option>GBP</option>
            <option>EUR</option>
            <option>USD</option>
          </select>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[#00395d] px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}

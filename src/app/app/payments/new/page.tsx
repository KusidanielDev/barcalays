// FILE: src/app/app/payments/new/page.tsx
"use client";
import useSWR from "swr";
import { useState, useMemo } from "react";

type Account = { id: string; name: string; number: string; balance: number };
type Payee = {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  reference?: string;
};
type ResA = { accounts: Account[] };
type ResP = { payees: Payee[] };

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export default function NewPayment() {
  const [tab, setTab] = useState<"internal" | "external" | "vendor">(
    "internal"
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: a } = useSWR<ResA>("/api/accounts", fetcher);
  const { data: p } = useSWR<ResP>("/api/payees", fetcher);
  const accounts = a?.accounts || [];
  const payees = p?.payees || [];

  const accountOptions = useMemo(
    () =>
      accounts.map((ac) => ({
        id: ac.id,
        label: `${ac.name} • ${ac.number} • £${(ac.balance / 100).toFixed(2)}`,
      })),
    [accounts]
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      if (tab === "internal") {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "INTERNAL",
            fromAccountId: fd.get("fromAccountId"),
            toAccountId: fd.get("toAccountId"),
            amountPence: Number(fd.get("amountPence")),
            description: fd.get("description"),
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Transfer failed");
        setMsg("Internal transfer completed.");
        (e.target as HTMLFormElement).reset();
      } else if (tab === "external") {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "EXTERNAL",
            fromAccountId: fd.get("fromAccountId"),
            payeeId: fd.get("payeeId"),
            amountPence: Number(fd.get("amountPence")),
            description: fd.get("description"),
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Payment failed");
        setMsg(`Payment pending. ID: ${j.pendingPaymentId}`);
      } else {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "EXTERNAL_VENDOR",
            fromAccountId: fd.get("fromAccountId"),
            amountPence: Number(fd.get("amountPence")),
            description: fd.get("description"),
            vendor: fd.get("vendor"),
            vendorHandle: fd.get("vendorHandle"),
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Vendor payment failed");
        setMsg(`Vendor payment pending. ID: ${j.pendingPaymentId}`);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">New payment</h1>

      <div className="flex gap-2">
        <button
          className={`border px-3 py-1 rounded ${
            tab === "internal" ? "bg-gray-100" : ""
          }`}
          onClick={() => setTab("internal")}
        >
          Internal
        </button>
        <button
          className={`border px-3 py-1 rounded ${
            tab === "external" ? "bg-gray-100" : ""
          }`}
          onClick={() => setTab("external")}
        >
          External bank
        </button>
        <button
          className={`border px-3 py-1 rounded ${
            tab === "vendor" ? "bg-gray-100" : ""
          }`}
          onClick={() => setTab("vendor")}
        >
          Vendor (PayPal / Wise)
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 text-red-700 p-2 text-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="rounded-md bg-green-50 text-green-700 p-2 text-sm">
          {msg}
        </div>
      )}

      <form
        className="grid gap-3 max-w-xl border rounded-xl p-3 bg-white"
        onSubmit={submit}
      >
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">From account</label>
            <select
              name="fromAccountId"
              required
              className="w-full border rounded px-2 py-1"
              defaultValue=""
            >
              <option value="" disabled>
                Select
              </option>
              {accountOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Amount (pence)</label>
            <input
              name="amountPence"
              type="number"
              min={1}
              required
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Description</label>
          <input
            name="description"
            placeholder="Optional (shown on your statement)"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {tab === "internal" && (
          <div>
            <label className="text-sm text-gray-600">To account</label>
            <select
              name="toAccountId"
              required
              className="w-full border rounded px-2 py-1"
              defaultValue=""
            >
              <option value="" disabled>
                Select
              </option>
              {accountOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === "external" && (
          <div>
            <label className="text-sm text-gray-600">Saved payee</label>
            <select
              name="payeeId"
              required
              className="w-full border rounded px-2 py-1"
              defaultValue=""
            >
              <option value="" disabled>
                Select
              </option>
              {payees.map((py) => (
                <option key={py.id} value={py.id}>
                  {py.name} • {py.sortCode} {py.accountNumber}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === "vendor" && (
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Vendor</label>
              <select
                name="vendor"
                required
                className="w-full border rounded px-2 py-1"
                defaultValue="PAYPAL"
              >
                <option value="PAYPAL">PayPal</option>
                <option value="WISE">Wise</option>
                <option value="REVOLUT">Revolut</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600">Handle / Email</label>
              <input
                name="vendorHandle"
                placeholder="PayPal email or vendor username"
                required
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="border px-3 py-1 rounded" disabled={loading}>
            {loading ? "Processing…" : "Submit"}
          </button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </form>
    </div>
  );
}

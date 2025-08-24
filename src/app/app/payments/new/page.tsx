// FILE: src/app/app/payments/new/page.tsx
"use client";
import { useState } from "react";

export default function NewPayment() {
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (tab === "internal") {
        const res = await fetch("/api/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromAccountId: fd.get("fromAccountId"),
            toAccountId: fd.get("toAccountId"),
            amountPence: Number(fd.get("amountPence")),
            description: fd.get("description"),
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Transfer failed");
        setMsg("Internal transfer completed.");
        e.currentTarget.reset();
      } else {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromAccountId: fd.get("fromAccountId"),
            payeeId: fd.get("payeeId"),
            amountPence: Number(fd.get("amountPence")),
            reference: fd.get("reference"),
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Payment failed");
        setMsg("External payment sent.");
        e.currentTarget.reset();
      }
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="card">
        <div className="flex gap-2">
          <button
            className={`btn-secondary ${
              tab === "internal" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
            onClick={() => setTab("internal")}
          >
            Internal
          </button>
          <button
            className={`btn-secondary ${
              tab === "external" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
            onClick={() => setTab("external")}
          >
            External
          </button>
        </div>

        <form className="mt-4 grid gap-3 max-w-xl" onSubmit={submit}>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">From account</label>
              <select name="fromAccountId" required>
                <option value="">Select</option>
                {/* server renders options via /app/api or SSR in real app; keep placeholders */}
                <option value="acc_main">Main</option>
                <option value="acc_savings">Savings</option>
              </select>
            </div>

            {tab === "internal" ? (
              <div>
                <label className="text-sm text-gray-600">To account</label>
                <select name="toAccountId" required>
                  <option value="">Select</option>
                  <option value="acc_main">Main</option>
                  <option value="acc_savings">Savings</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-sm text-gray-600">Payee</label>
                <select name="payeeId" required>
                  <option value="">Select</option>
                  <option value="payee_1">Example Payee</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-600">Amount (pence)</label>
            <input name="amountPence" type="number" min="1" step="1" required />
          </div>

          {tab === "internal" ? (
            <div>
              <label className="text-sm text-gray-600">Description</label>
              <input name="description" placeholder="Transfer description" />
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-600">Reference</label>
              <input name="reference" placeholder="Payment reference" />
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-primary" disabled={loading}>
              {loading ? "Processing…" : "Submit"}
            </button>
            {msg && <span className="text-sm text-gray-700">{msg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

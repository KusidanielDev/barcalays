// FILE: src/app/app/payments/page.tsx
"use client";
import useSWR from "swr";
import { useState } from "react";

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

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function PaymentsPage() {
  const { data: a } = useSWR<ResA>("/api/accounts", fetcher);
  const { data: p } = useSWR<ResP>("/api/payees", fetcher);
  const accounts = a?.accounts || [];
  const payees = p?.payees || [];

  const [tab, setTab] = useState<"internal" | "external">("external");
  const [msg, setMsg] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function submitInternal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "INTERNAL",
        fromAccountId: fd.get("from"),
        toAccountId: fd.get("to"),
        amountPence: Math.round(Number(fd.get("amount")) * 100),
        description: fd.get("desc") || "Transfer",
      }),
    });
    const j = await res.json();
    if (!res.ok) setMsg(j?.error || "Payment failed");
    else setMsg("Transfer completed");
  }

  async function submitExternal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const amount = Math.round(Number(fd.get("amount")) * 100);
    const isNew = fd.get("mode") === "new";
    const payload: any = {
      kind: "EXTERNAL",
      fromAccountId: fd.get("from"),
      amountPence: amount,
      description: fd.get("desc") || "Payment",
    };
    if (isNew) {
      payload.payee = {
        name: fd.get("name"),
        sortCode: fd.get("sort"),
        accountNumber: fd.get("acc"),
        reference: fd.get("ref") || undefined,
      };
    } else {
      payload.payeeId = fd.get("payeeId");
    }

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j?.error || "Payment failed");
      return;
    }
    // Expect { pendingPaymentId }
    setPendingId(j.pendingPaymentId);
    setMsg("Enter the OTP sent to your device.");
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingId, otp }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j?.error || "OTP invalid");
      return;
    }
    setMsg("Payment completed");
    setPendingId(null);
    setOtp("");
  }

  return (
    <div className="grid gap-6">
      <div className="card">
        <h1 className="text-xl font-bold text-barclays-navy">Payments</h1>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTab("external")}
            className={`btn-secondary ${
              tab === "external" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
          >
            To someone new / payee
          </button>
          <button
            onClick={() => setTab("internal")}
            className={`btn-secondary ${
              tab === "internal" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
          >
            Between your accounts
          </button>
        </div>

        {/* External */}
        {tab === "external" && (
          <div className="mt-4 grid gap-4">
            <form
              className="grid md:grid-cols-2 gap-4"
              onSubmit={submitExternal}
            >
              <div>
                <label className="text-sm text-gray-600">From account</label>
                <select name="from" required>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} • £{(a.balance / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Payment method</label>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value="saved"
                      defaultChecked
                    />{" "}
                    Saved payee
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="mode" value="new" /> New payee
                  </label>
                </div>
              </div>

              {/* Saved payee */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">
                  Select payee (if saved)
                </label>
                <select name="payeeId" defaultValue="">
                  <option value="">—</option>
                  {payees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {p.sortCode} {p.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* New payee fields */}
              <div>
                <label className="text-sm text-gray-600">Payee name</label>
                <input name="name" placeholder="Recipient name" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Sort code</label>
                <input name="sort" placeholder="12-34-56" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Account number</label>
                <input name="acc" placeholder="12345678" />
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Reference (optional)
                </label>
                <input name="ref" placeholder="Invoice 123" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Amount (£)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <input name="desc" placeholder="Payment description" />
              </div>

              <div className="md:col-span-2">
                <button className="btn-primary">Continue</button>
              </div>
            </form>

            {pendingId && (
              <form
                className="grid md:grid-cols-[1fr_auto] gap-2"
                onSubmit={confirm}
              >
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <button className="btn-primary">Confirm</button>
              </form>
            )}

            {msg && <div className="text-sm text-gray-700">{msg}</div>}
          </div>
        )}

        {/* Internal */}
        {tab === "internal" && (
          <form
            className="mt-4 grid md:grid-cols-2 gap-4"
            onSubmit={submitInternal}
          >
            <div>
              <label className="text-sm text-gray-600">From</label>
              <select name="from" required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • £{(a.balance / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <select name="to" required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • £{(a.balance / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Amount (£)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Description</label>
              <input name="desc" placeholder="Internal transfer" />
            </div>
            <div className="md:col-span-2">
              <button className="btn-primary">Transfer</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

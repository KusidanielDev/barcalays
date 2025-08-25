// FILE: src/app/app/payments/page.tsx
"use client";

import useSWR, { useSWRConfig } from "swr";
import { useMemo, useState } from "react";

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

export default function PaymentsPage() {
  const { mutate } = useSWRConfig();
  const { data: a } = useSWR<ResA>("/api/accounts", fetcher);
  const { data: p } = useSWR<ResP>("/api/payees", fetcher);

  const accounts = a?.accounts || [];
  const payees = p?.payees || [];

  // UI state
  const [tab, setTab] = useState<"internal" | "external">("external");
  const [mode, setMode] = useState<"saved" | "new">("saved");

  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const [busyInternal, setBusyInternal] = useState(false);
  const [busyExternal, setBusyExternal] = useState(false);
  const [busyOTP, setBusyOTP] = useState(false);

  const fromOptions = useMemo(
    () =>
      accounts.map((a) => ({
        id: a.id,
        label: `${a.name} • £${(a.balance / 100).toFixed(2)}`,
      })),
    [accounts]
  );

  function clearNotices() {
    setMsg(null);
    setError(null);
  }

  /** INTERNAL TRANSFER */
  async function submitInternal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearNotices();
    setBusyInternal(true);

    try {
      const fd = new FormData(e.currentTarget);
      const from = String(fd.get("from") || "");
      const to = String(fd.get("to") || "");
      const amountStr = String(fd.get("amount") || "0");
      const desc = String(fd.get("desc") || "Transfer");

      const amount = Math.round(Number(amountStr) * 100);
      if (!from || !to || from === to) {
        setError("Choose two different accounts.");
        return;
      }
      if (!(amount > 0)) {
        setError("Enter a valid amount greater than 0.");
        return;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "INTERNAL",
          fromAccountId: from,
          toAccountId: to,
          amountPence: amount,
          description: desc,
        }),
      });
      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "Payment failed");
        return;
      }

      setMsg("Transfer completed.");
      // refresh account balances
      mutate("/api/accounts");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err?.message || "Payment failed");
    } finally {
      setBusyInternal(false);
    }
  }

  /** EXTERNAL PAYMENT (with OTP) */
  async function submitExternal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearNotices();
    setBusyExternal(true);

    try {
      const fd = new FormData(e.currentTarget);
      const from = String(fd.get("from") || "");
      const amountStr = String(fd.get("amount") || "0");
      const desc = String(fd.get("desc") || "Payment");
      const formMode = String(fd.get("mode") || mode); // in case radio not interacted with
      const isNew = formMode === "new";

      const amount = Math.round(Number(amountStr) * 100);
      if (!from) {
        setError("Choose a source account.");
        return;
      }
      if (!(amount > 0)) {
        setError("Enter a valid amount greater than 0.");
        return;
      }

      const payload: any = {
        kind: "EXTERNAL",
        fromAccountId: from,
        amountPence: amount,
        description: desc,
      };

      if (isNew) {
        const name = String(fd.get("name") || "");
        const sortCode = String(fd.get("sort") || "");
        const accountNumber = String(fd.get("acc") || "");
        const reference = String(fd.get("ref") || "") || undefined;

        if (!name || !sortCode || !accountNumber) {
          setError(
            "Fill all new payee fields (name, sort code, account number)."
          );
          return;
        }

        payload.payee = {
          name,
          sortCode,
          accountNumber,
          reference,
        };
      } else {
        const payeeId = String(fd.get("payeeId") || "");
        if (!payeeId) {
          setError("Choose a saved payee or switch to New payee.");
          return;
        }
        payload.payeeId = payeeId;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "Payment failed");
        return;
      }

      // Expect { pendingPaymentId }
      setPendingId(j.pendingPaymentId);
      setMsg("Enter the OTP sent to your device.");
      // keep form values so user can confirm
    } catch (err: any) {
      setError(err?.message || "Payment failed");
    } finally {
      setBusyExternal(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    clearNotices();
    setBusyOTP(true);

    try {
      if (!pendingId) {
        setError("No payment to confirm.");
        return;
      }
      if (!otp || otp.length < 4) {
        setError("Enter a valid OTP.");
        return;
      }

      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pendingId, otp }),
      });
      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "OTP invalid");
        return;
      }

      setMsg("Payment completed.");
      setPendingId(null);
      setOtp("");
      // refresh accounts (balance) and saved payees maybe
      mutate("/api/accounts");
      mutate("/api/payees");
    } catch (err: any) {
      setError(err?.message || "Confirmation failed");
    } finally {
      setBusyOTP(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="card">
        <h1 className="text-xl font-bold text-barclays-navy">Payments</h1>

        {/* Notices */}
        <div className="mt-3 space-y-2" aria-live="polite">
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
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setTab("external");
              clearNotices();
            }}
            className={`btn-secondary ${
              tab === "external" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
          >
            To someone new / payee
          </button>
          <button
            onClick={() => {
              setTab("internal");
              clearNotices();
            }}
            className={`btn-secondary ${
              tab === "internal" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
          >
            Between your accounts
          </button>
        </div>

        {/* EXTERNAL */}
        {tab === "external" && (
          <div className="mt-4 grid gap-4">
            <form
              className="grid md:grid-cols-2 gap-4"
              onSubmit={submitExternal}
              aria-busy={busyExternal}
            >
              <div>
                <label className="text-sm text-gray-600">From account</label>
                <select
                  name="from"
                  required
                  disabled={busyExternal || !!pendingId}
                >
                  {fromOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
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
                      checked={mode === "saved"}
                      onChange={() => setMode("saved")}
                      disabled={busyExternal || !!pendingId}
                    />{" "}
                    Saved payee
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value="new"
                      checked={mode === "new"}
                      onChange={() => setMode("new")}
                      disabled={busyExternal || !!pendingId}
                    />{" "}
                    New payee
                  </label>
                </div>
              </div>

              {/* Saved payee select */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">
                  Select payee (if saved)
                </label>
                <select
                  name="payeeId"
                  defaultValue=""
                  disabled={mode === "new" || busyExternal || !!pendingId}
                >
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
                <input
                  name="name"
                  placeholder="Recipient name"
                  disabled={mode !== "new" || busyExternal || !!pendingId}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Sort code</label>
                <input
                  name="sort"
                  placeholder="12-34-56"
                  disabled={mode !== "new" || busyExternal || !!pendingId}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Account number</label>
                <input
                  name="acc"
                  placeholder="12345678"
                  disabled={mode !== "new" || busyExternal || !!pendingId}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Reference (optional)
                </label>
                <input
                  name="ref"
                  placeholder="Invoice 123"
                  disabled={mode !== "new" || busyExternal || !!pendingId}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Amount (£)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={busyExternal || !!pendingId}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <input
                  name="desc"
                  placeholder="Payment description"
                  disabled={busyExternal || !!pendingId}
                />
              </div>

              <div className="md:col-span-2">
                <button
                  className={`btn-primary ${busyExternal ? "opacity-60" : ""}`}
                  disabled={busyExternal || !!pendingId}
                >
                  {busyExternal ? "Processing…" : "Continue"}
                </button>
              </div>
            </form>

            {/* OTP confirm step */}
            {pendingId && (
              <form
                className="grid md:grid-cols-[1fr_auto] gap-2"
                onSubmit={confirm}
                aria-busy={busyOTP}
              >
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  disabled={busyOTP}
                />
                <button
                  className={`btn-primary ${busyOTP ? "opacity-60" : ""}`}
                  disabled={busyOTP}
                >
                  {busyOTP ? "Confirming…" : "Confirm"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* INTERNAL */}
        {tab === "internal" && (
          <form
            className="mt-4 grid md:grid-cols-2 gap-4"
            onSubmit={submitInternal}
            aria-busy={busyInternal}
          >
            <div>
              <label className="text-sm text-gray-600">From</label>
              <select name="from" required disabled={busyInternal}>
                {fromOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <select name="to" required disabled={busyInternal}>
                {fromOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
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
                disabled={busyInternal}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Description</label>
              <input
                name="desc"
                placeholder="Internal transfer"
                disabled={busyInternal}
              />
            </div>
            <div className="md:col-span-2">
              <button
                className={`btn-primary ${busyInternal ? "opacity-60" : ""}`}
                disabled={busyInternal}
              >
                {busyInternal ? "Transferring…" : "Transfer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

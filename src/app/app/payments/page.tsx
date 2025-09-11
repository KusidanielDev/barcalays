// FILE: src/app/app/payments/page.tsx
"use client";

import useSWR, { useSWRConfig } from "swr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // Load accounts & payees
  const { data: a } = useSWR<ResA>("/api/accounts", fetcher);
  const { data: p } = useSWR<ResP>("/api/payees", fetcher);
  const accounts = a?.accounts || [];
  const payees = p?.payees || [];

  // UI state
  const [tab, setTab] = useState<"external" | "internal" | "vendor">(
    "external"
  );
  const [mode, setMode] = useState<"saved" | "new">("saved"); // saved vs new payee

  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OTP flow
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<
    "EXTERNAL" | "EXTERNAL_VENDOR" | null
  >(null);
  const [otp, setOtp] = useState("");

  // Busy states
  const [busyInternal, setBusyInternal] = useState(false);
  const [busyExternal, setBusyExternal] = useState(false);
  const [busyVendor, setBusyVendor] = useState(false);
  const [busyOTP, setBusyOTP] = useState(false);

  // Options
  const accountOptions = useMemo(
    () =>
      accounts.map((ac) => ({
        id: ac.id,
        label: `${ac.name} • ${ac.number} • £${(ac.balance / 100).toFixed(2)}`,
      })),
    [accounts]
  );

  function clearNotices() {
    setMsg(null);
    setError(null);
  }

  /** ---------- INTERNAL TRANSFER ---------- */
  async function submitInternal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearNotices();
    setBusyInternal(true);
    try {
      const fd = new FormData(e.currentTarget);
      const fromAccountId = String(fd.get("from") || "");
      const toAccountId = String(fd.get("to") || "");
      const amountGBP = Number(String(fd.get("amount") || "0"));
      const description = String(fd.get("desc") || "Transfer");

      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        setError("Choose two different accounts.");
        return;
      }
      if (!(amountGBP > 0)) {
        setError("Enter a valid amount greater than 0.");
        return;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "INTERNAL",
          fromAccountId,
          toAccountId,
          amountPence: Math.round(amountGBP * 100),
          description,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || "Transfer failed");
        return;
      }

      setMsg("Transfer completed.");
      (e.target as HTMLFormElement).reset();

      // reflect balances/SSR pages immediately
      await Promise.all([mutate("/api/accounts")]);
      router.refresh();
      router.push("/app/transactions");
    } catch (err: any) {
      setError(err?.message || "Transfer failed");
    } finally {
      setBusyInternal(false);
    }
  }

  /** ---------- EXTERNAL BANK (OTP) ---------- */
  async function submitExternal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearNotices();
    setBusyExternal(true);

    try {
      const fd = new FormData(e.currentTarget);
      const fromAccountId = String(fd.get("from") || "");
      const amountGBP = Number(String(fd.get("amount") || "0"));
      const description = String(fd.get("desc") || "Payment");
      const formMode = String(fd.get("mode") || mode); // if radio not touched
      const isNew = formMode === "new";

      if (!fromAccountId) {
        setError("Choose a source account.");
        return;
      }
      if (!(amountGBP > 0)) {
        setError("Enter a valid amount greater than 0.");
        return;
      }

      const payload: any = {
        kind: "EXTERNAL",
        fromAccountId,
        amountPence: Math.round(amountGBP * 100),
        description,
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
        payload.payee = { name, sortCode, accountNumber, reference };
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
      setPendingKind("EXTERNAL");
      setMsg("Enter the OTP sent to your device to complete the payment.");
    } catch (err: any) {
      setError(err?.message || "Payment failed");
    } finally {
      setBusyExternal(false);
    }
  }

  /** ---------- EXTERNAL VENDOR (OTP) ---------- */
  async function submitVendor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearNotices();
    setBusyVendor(true);

    try {
      const fd = new FormData(e.currentTarget);
      const fromAccountId = String(fd.get("from") || "");
      const amountGBP = Number(String(fd.get("amount") || "0"));
      const description = String(fd.get("desc") || "");
      const vendor = String(fd.get("vendor") || "PAYPAL");
      const vendorHandle = String(fd.get("vendorHandle") || "");

      if (!fromAccountId) {
        setError("Choose a source account.");
        return;
      }
      if (!(amountGBP > 0)) {
        setError("Enter a valid amount greater than 0.");
        return;
      }
      if (!vendorHandle || vendorHandle.length < 3) {
        setError("Enter a valid vendor handle/email.");
        return;
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "EXTERNAL_VENDOR",
          fromAccountId,
          amountPence: Math.round(amountGBP * 100),
          description,
          vendor,
          vendorHandle,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || "Vendor payment failed");
        return;
      }

      setPendingId(j.pendingPaymentId);
      setPendingKind("EXTERNAL_VENDOR");
      setMsg(
        "Enter the OTP sent to your device to complete the vendor payment."
      );
    } catch (err: any) {
      setError(err?.message || "Vendor payment failed");
    } finally {
      setBusyVendor(false);
    }
  }

  /** ---------- OTP CONFIRM ---------- */
  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    clearNotices();
    setBusyOTP(true);

    try {
      if (!pendingId || !pendingKind) {
        setError("No payment to confirm.");
        return;
      }
      if (!otp || otp.length < 4) {
        setError("Enter a valid OTP.");
        return;
      }

      // IMPORTANT: send { paymentId, otp } (not { id })
      const url =
        pendingKind === "EXTERNAL_VENDOR"
          ? "/api/payments/external/confirm"
          : "/api/payments/confirm";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pendingId, otp }),
      });
      const j = await res.json();

      if (!res.ok) {
        setError(j?.error || "OTP invalid");
        return;
      }

      setMsg("Payment completed.");
      setPendingId(null);
      setPendingKind(null);
      setOtp("");

      // Refresh client APIs and SSR pages, then go to transactions
      await Promise.all([mutate("/api/accounts"), mutate("/api/payees")]);
      router.refresh();
      router.push("/app/transactions");
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTab("external");
              clearNotices();
            }}
            className={`btn-secondary ${
              tab === "external" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
          >
            To someone (bank payee)
          </button>
          <button
            onClick={() => {
              setTab("vendor");
              clearNotices();
            }}
            className={`btn-secondary ${
              tab === "vendor" ? "bg-gray-100 border-barclays-blue" : ""
            }`}
          >
            Vendor (PayPal / Wise / Revolut)
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

        {/* ---------- EXTERNAL (BANK) ---------- */}
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
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {accountOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Payment target</label>
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value="saved"
                      checked={mode === "saved"}
                      onChange={() => setMode("saved")}
                      disabled={busyExternal || !!pendingId}
                    />
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
                    />
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
                  {payees.map((py) => (
                    <option key={py.id} value={py.id}>
                      {py.name} • {py.sortCode} {py.accountNumber}
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
                  minLength={2}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Sort code</label>
                <input
                  name="sort"
                  placeholder="12-34-56"
                  disabled={mode !== "new" || busyExternal || !!pendingId}
                  pattern="^\d{2}-\d{2}-\d{2}$"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Account number</label>
                <input
                  name="acc"
                  placeholder="12345678"
                  disabled={mode !== "new" || busyExternal || !!pendingId}
                  pattern="^\d{8}$"
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

            {/* OTP confirm step (Bank) */}
            {pendingId && pendingKind === "EXTERNAL" && (
              <form
                className="grid md:grid-cols-[1fr_auto] gap-2"
                onSubmit={confirm}
                aria-busy={busyOTP}
              >
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
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

        {/* ---------- VENDOR (PAYPAL/WISE/REVOLUT) ---------- */}
        {tab === "vendor" && (
          <div className="mt-4 grid gap-4">
            <form
              className="grid md:grid-cols-2 gap-4"
              onSubmit={submitVendor}
              aria-busy={busyVendor}
            >
              <div>
                <label className="text-sm text-gray-600">From account</label>
                <select
                  name="from"
                  required
                  disabled={busyVendor || !!pendingId}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {accountOptions.map((opt) => (
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
                  disabled={busyVendor || !!pendingId}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Vendor</label>
                <select
                  name="vendor"
                  required
                  disabled={busyVendor || !!pendingId}
                  defaultValue="PAYPAL"
                >
                  <option value="PAYPAL">PayPal</option>
                  <option value="WISE">Wise</option>
                  <option value="REVOLUT">Revolut</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Handle / Email</label>
                <input
                  name="vendorHandle"
                  placeholder="PayPal email or vendor username"
                  required
                  disabled={busyVendor || !!pendingId}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">
                  Description (optional)
                </label>
                <input
                  name="desc"
                  placeholder="e.g. PayPal purchase"
                  disabled={busyVendor || !!pendingId}
                />
              </div>

              <div className="md:col-span-2">
                <button
                  className={`btn-primary ${busyVendor ? "opacity-60" : ""}`}
                  disabled={busyVendor || !!pendingId}
                >
                  {busyVendor ? "Processing…" : "Continue"}
                </button>
              </div>
            </form>

            {/* OTP confirm step (Vendor) */}
            {pendingId && pendingKind === "EXTERNAL_VENDOR" && (
              <form
                className="grid md:grid-cols-[1fr_auto] gap-2"
                onSubmit={confirm}
                aria-busy={busyOTP}
              >
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
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

        {/* ---------- INTERNAL ---------- */}
        {tab === "internal" && (
          <form
            className="mt-4 grid md:grid-cols-2 gap-4"
            onSubmit={submitInternal}
            aria-busy={busyInternal}
          >
            <div>
              <label className="text-sm text-gray-600">From</label>
              <select
                name="from"
                required
                disabled={busyInternal}
                defaultValue=""
              >
                <option value="" disabled>
                  Select
                </option>
                {accountOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <select
                name="to"
                required
                disabled={busyInternal}
                defaultValue=""
              >
                <option value="" disabled>
                  Select
                </option>
                {accountOptions.map((opt) => (
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

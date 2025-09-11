// FILE: src/app/app/transactions/page.tsx
"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function TransactionsPage() {
  const { data } = useSWR("/api/accounts", fetcher);
  const accounts = data?.accounts || [];
  const [acct, setAcct] = useState<string>("");
  const [q, setQ] = useState("");

  const { data: txData } = useSWR(
    () => (acct ? `/api/accounts/${acct}/transactions` : null),
    fetcher
  );

  // Memoize tx so referential identity is stable across renders
  const tx = useMemo(() => txData?.transactions ?? [], [txData]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tx;
    return tx.filter(
      (t: any) =>
        (t.description || "").toLowerCase().includes(s) ||
        String(t.amount).includes(s)
    );
  }, [q, tx]);

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-barclays-navy">Transactions</h1>
      <div className="mt-4 flex gap-2 items-center">
        <select
          value={acct}
          onChange={(e) => setAcct(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">Select account</option>
          {accounts.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.name} • {a.number}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search description or amount..."
          className="rounded border px-3 py-2 w-64"
        />
        {acct && (
          <a
            className="btn-secondary"
            href={`/api/accounts/${acct}/statement.csv`}
          >
            Export CSV
          </a>
        )}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Admin msg</th>
              <th className="py-2 pr-3 text-right">Amount</th>
              <th className="py-2 text-right">Balance after</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="py-2 pr-3 whitespace-nowrap">
                  {new Date(t.postedAt).toLocaleDateString("en-GB")}{" "}
                  <span className="text-gray-500">
                    {new Date(t.postedAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </td>
                <td className="pr-3">{t.description}</td>
                <td className="pr-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide border ${badge(
                      t.status
                    )}`}
                  >
                    {t.status || "POSTED"}
                  </span>
                </td>
                <td className="pr-3 max-w-[320px] truncate">
                  {t.adminMessage || ""}
                </td>
                <td
                  className={`pr-3 text-right tabular-nums ${
                    t.amount < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  £{(Math.abs(t.amount) / 100).toFixed(2)}
                </td>
                <td className="text-right tabular-nums">
                  £{(t.balanceAfter / 100).toFixed(2)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function badge(s: string) {
  switch (s) {
    case "ERROR":
      return "bg-red-50 text-red-700 border-red-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "REVERSED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

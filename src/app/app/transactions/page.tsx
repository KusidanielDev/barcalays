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
              <th className="py-2">Date</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="py-2">
                  {new Date(t.postedAt).toLocaleDateString("en-GB")}
                </td>
                <td>{t.description}</td>
                <td className="text-right">{(t.amount / 100).toFixed(2)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
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

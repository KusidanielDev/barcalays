// FILE: src/app/invest/parts/CashTable.tsx
"use client";

import * as React from "react";

type CashTxn = {
  id: string;
  postedAt: string; // ISO string
  amountPence: number;
  note?: string | null;
  account?: { name: string } | null;
};

export default function CashTable({ txns }: { txns: CashTxn[] }) {
  const fmtGBP = (p: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(p / 100);

  if (!txns || txns.length === 0) {
    return (
      <div className="card">
        <div className="text-sm text-gray-600">No cash movements yet.</div>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <div className="font-semibold mb-3">Cash movements</div>
      <table className="w-full text-sm">
        <thead className="text-left text-gray-600">
          <tr>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Account</th>
            <th className="py-2 pr-4">Note</th>
            <th className="py-2 pr-0 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {txns.map((t) => {
            const amt = t.amountPence;
            const isOut = amt < 0;
            return (
              <tr key={t.id}>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {new Date(t.postedAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">{t.account?.name ?? "—"}</td>
                <td className="py-2 pr-4">{t.note ?? "—"}</td>
                <td
                  className={`py-2 pr-0 text-right font-medium ${
                    isOut ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {fmtGBP(amt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

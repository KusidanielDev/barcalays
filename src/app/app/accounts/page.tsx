// FILE: src/app/app/accounts/page.tsx
"use client";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useState } from "react";

type Account = {
  id: string;
  name: string;
  number: string;
  sortCode: string;
  balance: number;
  type: string;
  currency: string;
  status: string;
};
type Resp = { accounts: Account[] };

const fetcher = (u: string) => fetch(u).then((r) => r.json() as Promise<Resp>);
const fmtGBP = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    p / 100
  );

export default function AccountsPage() {
  const { data, isLoading } = useSWR("/api/accounts", fetcher);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const accounts = data?.accounts || [];

  async function closeAccount(id: string) {
    if (!confirm("Close this account? This cannot be undone.")) return;
    const res = await fetch(`/api/accounts/${id}/close`, { method: "POST" });
    if (res.ok) mutate("/api/accounts");
  }

  async function createCard(id: string) {
    const res = await fetch(`/api/cards/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: id }),
    });
    if (res.ok) alert("Card created. See Cards page.");
  }

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-barclays-navy">Your Accounts</h1>
        <Link
          href="/app/accounts/new"
          className="btn-primary hidden sm:inline-flex"
        >
          Open new account
        </Link>
      </div>

      {/* Mobile floating action button */}
      <Link
        href="/app/accounts/new"
        className="fixed bottom-6 right-6 z-10 sm:hidden flex items-center justify-center w-14 h-14 bg-barclays-blue text-white rounded-full shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </Link>

      {/* Desktop table view */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-3 pl-4">Account Name</th>
              <th>Type</th>
              <th>Account Details</th>
              <th>Balance</th>
              <th className="text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="py-4 pl-4 font-medium text-barclays-navy">
                  {a.name}
                </td>
                <td className="text-gray-600">
                  <span className="bg-barclays-blue/10 text-barclays-blue text-xs px-2 py-1 rounded-full">
                    {a.type}
                  </span>
                </td>
                <td className="text-gray-600">
                  {a.number} • {a.sortCode}
                </td>
                <td className="font-semibold text-barclays-navy">
                  {fmtGBP(a.balance)}
                </td>
                <td className="text-right pr-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      className="btn-secondary text-xs"
                      href={`/app/accounts/${a.id}`}
                    >
                      Details
                    </Link>
                    <Link
                      className="btn-secondary text-xs"
                      href={`/app/transactions?account=${a.id}`}
                    >
                      Transactions
                    </Link>
                    <a
                      className="btn-secondary text-xs"
                      href={`/api/accounts/${a.id}/statement.csv`}
                    >
                      Statement
                    </a>
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => createCard(a.id)}
                    >
                      New card
                    </button>
                    <button
                      className="btn-secondary text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                      onClick={() => closeAccount(a.id)}
                    >
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && accounts.length === 0 && (
              <tr>
                <td className="py-8 text-center text-gray-600" colSpan={5}>
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-6 0H5m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <p className="mb-4">No accounts yet.</p>
                    <Link href="/app/accounts/new" className="btn-primary">
                      Open your first account
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-barclays-navy">{a.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {a.number} • {a.sortCode}
                </p>
                <span className="inline-block bg-barclays-blue/10 text-barclays-blue text-xs px-2 py-1 rounded-full mt-2">
                  {a.type}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown(a.id)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {activeDropdown === a.id && (
                  <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg border py-1">
                    <Link
                      href={`/app/accounts/${a.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Account Details
                    </Link>
                    <Link
                      href={`/app/transactions?account=${a.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setActiveDropdown(null)}
                    >
                      View Transactions
                    </Link>
                    <a
                      href={`/api/accounts/${a.id}/statement.csv`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Download Statement
                    </a>
                    <button
                      onClick={() => {
                        createCard(a.id);
                        setActiveDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Request New Card
                    </button>
                    <button
                      onClick={() => {
                        closeAccount(a.id);
                        setActiveDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Close Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-xl font-bold text-barclays-navy">
                  {fmtGBP(a.balance)}
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/app/accounts/${a.id}`}
                  className="btn-secondary text-xs py-2"
                >
                  View
                </Link>
                <Link
                  href={`/app/transactions?account=${a.id}`}
                  className="btn-secondary text-xs py-2"
                >
                  Transactions
                </Link>
              </div>
            </div>
          </div>
        ))}

        {!isLoading && accounts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-6 0H5m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-600 mb-4">No accounts yet.</p>
            <Link href="/app/accounts/new" className="btn-primary inline-block">
              Open your first account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

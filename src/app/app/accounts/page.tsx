// FILE: src/app/app/accounts/page.tsx
"use client";
import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";

type Account = {
  id: string;
  name: string;
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
        aria-label="Open new account"
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 5v14m-7-7h14" />
        </svg>
      </Link>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-3 pl-4">Account Name</th>
              <th>Type</th>
              {/* removed Account Details (number/sort) column */}
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
                    <a
                      className="btn-secondary text-xs"
                      href={`/api/accounts/${a.id}/statement.csv`}
                    >
                      Statement CSV
                    </a>
                    {/* removed New Card + Close actions */}
                  </div>
                </td>
              </tr>
            ))}

            {!isLoading && accounts.length === 0 && (
              <tr>
                <td className="py-4 text-gray-600" colSpan={4}>
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-barclays-navy">{a.name}</h3>
                <span className="inline-block bg-barclays-blue/10 text-barclays-blue text-xs px-2 py-1 rounded-full mt-2">
                  {a.type}
                </span>
              </div>

              {/* actions collapsed into a small dropdown (only Details/CSV) */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown(a.id)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="More actions"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>
                {activeDropdown === a.id && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-20">
                    <Link
                      href={`/app/accounts/${a.id}`}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Details
                    </Link>
                    <a
                      href={`/api/accounts/${a.id}/statement.csv`}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setActiveDropdown(null)}
                    >
                      Statement CSV
                    </a>
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
            </div>
          </div>
        ))}

        {!isLoading && accounts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
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

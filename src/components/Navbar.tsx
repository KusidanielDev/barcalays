"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar({
  loggedIn,
  isAdmin,
}: {
  loggedIn: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-gray-200">
      <div className="container py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded bg-barclays-blue"
            aria-label="Logo"
          ></div>
          <span className="font-bold text-barclays-navy">Barclays ( )</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/accounts" className="hover:text-barclays-blue">
            Current Accounts
          </Link>
          <Link href="/#cards" className="hover:text-barclays-blue">
            Credit Cards
          </Link>
          <Link href="/#loans" className="hover:text-barclays-blue">
            Loans
          </Link>
          <Link href="/#mortgages" className="hover:text-barclays-blue">
            Mortgages
          </Link>
          {loggedIn ? (
            <>
              <Link href="/app" className="btn-secondary">
                My Banking
              </Link>
              <Link href="/app/transactions" className="ml-2 text-sm underline">
                Transactions
              </Link>
              <Link href="/app/payments/new" className="ml-2 text-sm underline">
                Payments
              </Link>
              <Link href="/app/payees" className="ml-2 text-sm underline">
                Payees
              </Link>
              <Link
                href="/app/standing-orders"
                className="ml-2 text-sm underline"
              >
                Standing orders
              </Link>
              <Link href="/app/cards" className="ml-2 text-sm underline">
                Cards
              </Link>
              <Link href="/app/goals" className="ml-2 text-sm underline">
                Goals
              </Link>
              <Link href="/app/budgets" className="ml-2 text-sm underline">
                Budgets
              </Link>
              <Link href="/app/analytics" className="ml-2 text-sm underline">
                Analytics
              </Link>
              <Link
                href="/app/notifications"
                className="ml-2 text-sm underline"
              >
                Notifications
              </Link>
              <Link href="/app/support" className="ml-2 text-sm underline">
                Support
              </Link>
              <Link href="/app/settings" className="ml-2 text-sm underline">
                Settings
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Log in
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-sm underline">
              Admin
            </Link>
          )}
        </nav>

        <button
          className="md:hidden p-2 rounded border"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t">
          <div className="container py-2 flex flex-col gap-2">
            <Link href="/accounts" onClick={() => setOpen(false)}>
              Current Accounts
            </Link>
            <Link href="/#cards" onClick={() => setOpen(false)}>
              Credit Cards
            </Link>
            <Link href="/#loans" onClick={() => setOpen(false)}>
              Loans
            </Link>
            <Link href="/#mortgages" onClick={() => setOpen(false)}>
              Mortgages
            </Link>
            {loggedIn ? (
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="btn-secondary mt-2"
              >
                My Banking
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-primary mt-2"
              >
                Log in
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-sm underline"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

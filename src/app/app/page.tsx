// FILE: src/app/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const fmtGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100
  );

export default async function Dashboard() {
  const session = await auth();
  const email = session?.user?.email || "";
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  const [accounts, soCount, txCount] = user
    ? await Promise.all([
        prisma.account.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        }),
        prisma.standingOrder.count({
          where: { userId: user.id, active: true },
        }),
        prisma.transaction.count({ where: { account: { userId: user.id } } }),
      ])
    : [[], 0, 0];

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="grid gap-6">
      {/* Accent banner */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-sky-50 to-white px-5 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600">Welcome back</div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold text-barclays-navy">
              Total balance {fmtGBP(totalBalance)}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {accounts.length} account{accounts.length === 1 ? "" : "s"} •{" "}
              {txCount} transactions • {soCount} standing orders
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/payments" className="btn-primary">
              New payment
            </Link>
            <Link href="/app/transactions" className="btn-secondary">
              View all transactions
            </Link>
            <Link href="/app/settings" className="btn-secondary">
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Accounts strip */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-barclays-navy">Your accounts</div>
          <Link href="/app/accounts/new" className="btn-secondary">
            Open new account
          </Link>
        </div>
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`/app/accounts/${a.id}`}
              className="border rounded-2xl p-4 hover:bg-gray-50"
            >
              <div className="text-sm text-gray-600">{a.name}</div>
              <div className="text-xl font-semibold">{fmtGBP(a.balance)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {a.number} • {a.sortCode}
              </div>
            </Link>
          ))}
          {accounts.length === 0 && (
            <div className="text-sm text-gray-600">
              No accounts yet. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* Feature tiles (the “left-out names” you wanted as buttons) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/app/payments" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Payments</div>
          <div className="text-sm text-gray-600">Send money to anyone.</div>
        </Link>
        <Link href="/app/transactions" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">
            View all transactions
          </div>
          <div className="text-sm text-gray-600">Full history & export.</div>
        </Link>
        <Link href="/app/cards" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Cards</div>
          <div className="text-sm text-gray-600">
            Freeze / unfreeze & details.
          </div>
        </Link>
        <Link href="/app/loans" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Loans</div>
          <div className="text-sm text-gray-600">
            Apply & manage repayments.
          </div>
        </Link>
        <Link href="/app/goals" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Goals</div>
          <div className="text-sm text-gray-600">Save towards targets.</div>
        </Link>
        <Link href="/app/budgets" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Budgets</div>
          <div className="text-sm text-gray-600">Set limits & track spend.</div>
        </Link>
        <Link href="/app/analytics" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Analytics</div>
          <div className="text-sm text-gray-600">Trends & insights.</div>
        </Link>
        <Link href="/app/support" className="card hover:bg-gray-50">
          <div className="font-semibold text-barclays-navy">Support</div>
          <div className="text-sm text-gray-600">Get help and contact us.</div>
        </Link>
      </div>
    </div>
  );
}

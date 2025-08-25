// FILE: src/app/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import InvestSection from "./parts/InvestSection";
import StocksTicker from "./parts/StocksTicker";
import TeslaChart from "./parts/TeslaChart";

/** ---------- Types for safe client props ---------- */
type ClientAccount = {
  id: string;
  name: string;
  type: string;
  number: string;
  balance: number;
  currency: string;
};
type ClientTxn = {
  id: string;
  postedAt: string;
  description: string;
  amount: number;
  accountName: string;
};
type ClientHolding = {
  id: string;
  accountId: string;
  quantity: number;
  avgCostP: number;
  updatedAt: string;
  security: { symbol: string; name: string; currency: string };
  account: { id: string; name: string };
};

/** ---------- Helpers ---------- */
const fmtGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100
  );

// simple sparkline from values
function sparkPath(values: number[], width = 260, height = 64, pad = 6) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const W = width - pad * 2;
  const H = height - pad * 2;
  const step = values.length > 1 ? W / (values.length - 1) : W;

  const y = (v: number) => pad + H - ((v - min) / span) * H;
  const x = (i: number) => pad + i * step;

  let d = `M ${x(0)} ${y(values[0])}`;
  for (let i = 1; i < values.length; i++) d += ` L ${x(i)} ${y(values[i])}`;
  return d;
}

export default async function Dashboard() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() || "";
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  const [accountsDb, soCount, txDb] = user
    ? await Promise.all([
        prisma.account.findMany({
          where: { userId: user.id, status: { in: ["OPEN", "PENDING"] } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.standingOrder.count({
          where: { userId: user.id, active: true },
        }),
        prisma.transaction.findMany({
          where: { account: { userId: user.id } },
          include: { account: true },
          orderBy: { postedAt: "desc" },
          take: 20, // grab a few more for sparkline
        }),
      ])
    : [[], 0, [] as any[]];

  const accounts: ClientAccount[] = accountsDb.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    number: a.number,
    balance: a.balance,
    currency: a.currency,
  }));

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const txns: ClientTxn[] = txDb.slice(0, 10).map((t) => ({
    id: t.id,
    postedAt: t.postedAt.toISOString(),
    description: t.description,
    amount: t.amount,
    accountName: t.account.name,
  }));

  // Build a small synthetic “trend” series from last N transactions for the banner sparkline
  const sparkSeries = (() => {
    if (!txDb.length) return [totalBalance, totalBalance];
    // reverse to oldest → newest
    const seq = [...txDb].reverse().map((t) => t.amount);
    // start roughly a few transactions back from total, then add forward
    const start = totalBalance - seq.reduce((s, v) => s + v, 0) * 0.4; // softened baseline
    const acc: number[] = [start];
    for (let i = 0; i < seq.length; i++) acc.push(acc[acc.length - 1] + seq[i]);
    // clamp and scale a bit so it looks nice
    return acc.slice(-16);
  })();

  const bankAccounts = accounts.filter((a) => a.type !== "INVESTMENT");
  const investAccounts = accounts.filter((a) => a.type === "INVESTMENT");
  const hasInvest = investAccounts.length > 0;

  // If investment accounts exist, include holdings for the InvestSection
  let holdings: ClientHolding[] = [];
  if (hasInvest) {
    const accountIds = investAccounts.map((a) => a.id);
    const hDb = await prisma.holding.findMany({
      where: { accountId: { in: accountIds } },
      include: { security: true, account: true },
      orderBy: { updatedAt: "desc" },
    });
    holdings = hDb.map((h) => ({
      id: h.id,
      accountId: h.accountId,
      quantity: Number(h.quantity as any),
      avgCostP: h.avgCostP,
      updatedAt: h.updatedAt.toISOString(),
      security: {
        symbol: h.security.symbol,
        name: h.security.name,
        currency: h.security.currency,
      },
      account: { id: h.account.id, name: h.account.name },
    }));
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Top bar: title + live ticker */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-barclays-navy">Dashboard</h1>
        <StocksTicker
          symbols={
            hasInvest && holdings.length
              ? Array.from(new Set(holdings.map((h) => h.security.symbol)))
              : ["AAPL", "TSLA", "VUSA", "LGEN", "HSBA"]
          }
        />
      </div>

      {/* Accent banner with sparkline */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-sky-50 to-white px-5 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-sm text-gray-600">Welcome back</div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold text-barclays-navy">
              Total balance {fmtGBP(totalBalance)}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {accounts.length} account{accounts.length === 1 ? "" : "s"} •{" "}
              {txDb.length} recent transactions • {soCount} standing orders
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
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

          {/* Tiny sparkline on the right */}
          <div className="md:pr-2">
            <svg
              viewBox="0 0 260 64"
              className="w-[260px] h-[64px]"
              aria-hidden
            >
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00AEEF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00AEEF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="260" height="64" fill="white" rx="10" />
              <path
                d={sparkPath(sparkSeries)}
                fill="none"
                stroke="#00AEEF"
                strokeWidth="2"
              />
              {/* Area fill under line */}
              <path
                d={sparkPath(sparkSeries) + " L 254 58 L 6 58 Z"}
                fill="url(#grad)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tesla mini market widget */}
      <TeslaChart />

      {/* Your accounts strip */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-barclays-navy">Your accounts</div>
          <div className="flex gap-2">
            <Link href="/app/accounts/new" className="btn-secondary">
              Open new account
            </Link>
            <Link
              href="/app/accounts/new?preset=INVESTMENT"
              className="btn-primary"
            >
              Create investment account
            </Link>
          </div>
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
                {a.number} • {a.currency}
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

      {/* Recent activity */}
      <section className="card">
        <div className="font-semibold mb-3">Recent activity</div>
        <div className="divide-y">
          {txns.length ? (
            txns.map((t) => (
              <div
                key={t.id}
                className="py-2 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(t.postedAt).toLocaleString()} · {t.accountName}
                  </div>
                </div>
                <div
                  className={`font-semibold ${
                    t.amount < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  £{(t.amount / 100).toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600">No recent transactions</div>
          )}
        </div>
      </section>

      {/* Investment widgets OR CTA */}
      {hasInvest ? (
        <InvestSection accounts={investAccounts} holdings={holdings} />
      ) : (
        <section className="card">
          <div className="md:flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">Start investing</div>
              <p className="text-gray-700 mt-1">
                Create an investment account to buy shares and funds.
              </p>
            </div>
            <a
              href="/app/accounts/new?preset=INVESTMENT"
              className="btn-primary mt-3 md:mt-0"
            >
              Create investment account
            </a>
          </div>
        </section>
      )}

      {/* Feature tiles (Loans, Cards, etc.) */}
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

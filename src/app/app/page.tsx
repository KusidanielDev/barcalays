// FILE: src/app/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import InvestSection from "./parts/InvestSection";
import StocksTicker from "./parts/StocksTicker";
import TeslaChart from "./parts/TeslaChart";
import IncomeSummary from "./parts/IncomeSummary";

/** ---------- Types ---------- */
type ClientAccount = {
  id: string;
  name: string;
  type: string;
  number: string;
  balance: number; // pence (cash)
  currency: string;
};
type ClientTxn = {
  id: string;
  postedAt: string;
  description: string;
  amount: number; // pence
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
    (pence ?? 0) / 100
  );

function fmtDT(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

const BASE: Record<string, number> = {
  AAPL: 189.12,
  TSLA: 239.55,
  VUSA: 77.32,
  LGEN: 2.45,
  HSBA: 6.9,
  MSFT: 430.25,
  AMZN: 171.16,
  NVDA: 122.55,
  GOOGL: 168.38,
  META: 517.57,
  BP: 4.85,
  SHEL: 28.72,
  BARC: 1.45,
  RIO: 56.12,
  VOD: 0.72,
  INF: 8.5,
  ENM: 9.1,
};
function serverPriceFor(sym: string, t: number) {
  const base = BASE[sym] ?? 100;
  const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
  const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
  return Math.max(0.5, base + wave + micro);
}

export default async function Dashboard() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() || "";
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  const [accountsDb, txDb] = user
    ? await Promise.all([
        prisma.account.findMany({
          where: { userId: user.id, status: { in: ["OPEN", "PENDING"] } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.transaction.findMany({
          where: { account: { userId: user.id } },
          include: { account: true },
          orderBy: { postedAt: "desc" },
          take: 100,
        }),
      ])
    : [[], [] as any[]];

  const accounts: ClientAccount[] = (accountsDb ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    number: a.number,
    balance: a.balance,
    currency: a.currency,
  }));

  const investAccountIds = accounts
    .filter((a) => a.type === "INVESTMENT")
    .map((a) => a.id);
  const hasInvest = investAccountIds.length > 0;

  let holdings: ClientHolding[] = [];
  if (hasInvest) {
    const hDb = await prisma.holding.findMany({
      where: { accountId: { in: investAccountIds } },
      include: { security: true, account: true },
      orderBy: { updatedAt: "desc" },
    });
    holdings = (hDb ?? []).map((h) => ({
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

  const t = Date.now();
  const holdingsByAccountValueP: Record<string, number> = {};
  for (const h of holdings) {
    const sym = h.security.symbol.toUpperCase();
    const px = serverPriceFor(sym, t);
    const priceP = Math.round(px * 100);
    const valueP = Math.round(Number(h.quantity) * priceP);
    holdingsByAccountValueP[h.accountId] =
      (holdingsByAccountValueP[h.accountId] || 0) + valueP;
  }

  const cashTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const investValue = Object.values(holdingsByAccountValueP).reduce(
    (s, v) => s + v,
    0
  );
  const netWorth = cashTotal + investValue;

  const txns: ClientTxn[] = (txDb ?? []).slice(0, 12).map((t) => ({
    id: t.id,
    postedAt: t.postedAt.toISOString(),
    description: t.description,
    amount: t.amount,
    accountName: t.account.name,
  }));

  const sparkSeries = (() => {
    const base = netWorth;
    if (!(txDb ?? []).length) return [base, base];
    const seq = [...txDb].reverse().map((t) => t.amount);
    const start = base - seq.reduce((s, v) => s + v, 0) * 0.2;
    const acc: number[] = [start];
    for (let i = 0; i < seq.length; i++) acc.push(acc[acc.length - 1] + seq[i]);
    return acc.slice(-16);
  })();

  const latestReturns = txDb.find((t) =>
    /Monthly returns/i.test(t.description)
  );
  const latestDivs = txDb.find((t) => /Dividends/i.test(t.description));
  const monthlyReturnsP = latestReturns?.amount ?? 0;
  const monthlyDividendsP = latestDivs?.amount ?? 0;

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-barclays-navy">Dashboard</h1>
          <div className="min-w-0 max-w-full overflow-hidden">
            <StocksTicker
              symbols={
                hasInvest && holdings.length
                  ? Array.from(new Set(holdings.map((h) => h.security.symbol)))
                  : ["AAPL", "TSLA", "VUSA", "LGEN", "HSBA"]
              }
            />
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-sky-50 to-white px-5 py-6 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0">
              <div className="text-sm text-gray-600">Welcome back</div>
              <div className="mt-1 text-2xl md:text-3xl font-semibold text-barclays-navy">
                Net worth {fmtGBP(netWorth)}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Cash {fmtGBP(cashTotal)} • Investments {fmtGBP(investValue)}
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
            <div className="hidden md:block md:pr-2">
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
                <path
                  d={sparkPath(sparkSeries) + " L 254 58 L 6 58 Z"}
                  fill="url(#grad)"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Income summary */}
        <IncomeSummary
          returnsP={monthlyReturnsP}
          dividendsP={monthlyDividendsP}
          startDateLabel={"7 Jan 2025"}
        />

        {/* Tesla chart */}
        <div className="overflow-hidden rounded-2xl">
          <TeslaChart />
        </div>

        {/* Investment widgets — NOW pass ALL accounts so Savings appears in Current holdings */}
        <InvestSection accountsAll={accounts} holdings={holdings} />

        {/* Your accounts */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-barclays-navy">
              Your accounts
            </div>
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

          {/* Mobile scroller */}
          <div className="mt-3 md:hidden">
            <div
              className="overflow-x-auto overscroll-x-contain touch-pan-x"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex gap-3 pb-2">
                {accounts.length ? (
                  accounts.map((a) => {
                    const holdingsP = holdingsByAccountValueP[a.id] || 0;
                    const isInvest = a.type === "INVESTMENT";
                    const totalP = isInvest ? a.balance + holdingsP : a.balance;
                    return (
                      <Link
                        key={a.id}
                        href={`/app/accounts/${a.id}`}
                        className="flex-shrink-0 w-64 rounded-2xl border p-4 hover:bg-gray-50"
                      >
                        <div className="text-sm text-gray-600 truncate">
                          {a.name}
                        </div>
                        <div className="text-xl font-semibold">
                          {fmtGBP(totalP)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {isInvest
                            ? `cash ${fmtGBP(a.balance)} • holdings ${fmtGBP(
                                holdingsP
                              )}`
                            : `${a.number} • ${a.currency}`}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-600">
                    No accounts yet. Create one to get started.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop grid */}
          <div className="mt-3 hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((a) => {
              const holdingsP = holdingsByAccountValueP[a.id] || 0;
              const isInvest = a.type === "INVESTMENT";
              const totalP = isInvest ? a.balance + holdingsP : a.balance;
              return (
                <Link
                  key={a.id}
                  href={`/app/accounts/${a.id}`}
                  className="rounded-2xl border p-4 hover:bg-gray-50 min-w-0"
                >
                  <div className="text-sm text-gray-600 truncate">{a.name}</div>
                  <div className="text-xl font-semibold">{fmtGBP(totalP)}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {isInvest
                      ? `cash ${fmtGBP(a.balance)} • holdings ${fmtGBP(
                          holdingsP
                        )}`
                      : `${a.number} • ${a.currency}`}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <section className="card overflow-hidden">
          <div className="font-semibold mb-3">Recent activity</div>
          <div className="divide-y">
            {txns.length ? (
              txns.map((t) => (
                <div
                  key={t.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.description}</div>
                    <div className="text-xs text-gray-500">
                      {fmtDT(t.postedAt)} · {t.accountName}
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
              <div className="text-sm text-gray-600">
                No recent transactions
              </div>
            )}
          </div>
        </section>

        {/* Feature tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-sm text-gray-600">
              Set limits & track spend.
            </div>
          </Link>
          <Link href="/app/analytics" className="card hover:bg-gray-50">
            <div className="font-semibold text-barclays-navy">Analytics</div>
            <div className="text-sm text-gray-600">Trends & insights.</div>
          </Link>
          <Link href="/app/support" className="card hover:bg-gray-50">
            <div className="font-semibold text-barclays-navy">Support</div>
            <div className="text-sm text-gray-600">
              Get help and contact us.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

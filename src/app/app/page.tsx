// FILE: src/app/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import InvestSection from "./parts/InvestSection";
import StocksTicker from "./parts/StocksTicker";
import StocksMultiChart from "./parts/StocksMultiChart";
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
  status?: string;
  adminMessage?: string | null;
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

function fmtDT(when: string | Date) {
  const d = typeof when === "string" ? new Date(when) : when;
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

function badge(s?: string) {
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

/** ---------- Deterministic price anchors (for charts/PL only) ---------- */
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
function serverPriceFor(sym: string) {
  return Math.max(0.5, BASE[sym] ?? 100); // fixed to keep UI totals stable
}

export default async function Dashboard() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() || "";
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;
  const displayName =
    (user as any)?.fullName ||
    user?.name ||
    session?.user?.name ||
    (email ? email.split("@")[0] : "there");

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
          take: 120,
        }),
      ])
    : [[], [] as any[]];

  // Use all accounts directly
  const accounts: ClientAccount[] = (accountsDb ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    number: a.number,
    balance: a.balance,
    currency: a.currency,
  }));

  // Holdings (only for investment accounts)
  const investAccountIds = accounts
    .filter((a) => a.type === "INVESTMENT")
    .map((a) => a.id);

  let holdings: ClientHolding[] = [];
  if (investAccountIds.length) {
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

  // Compute holdings value
  const holdingsByAccountValueP: Record<string, number> = {};
  for (const h of holdings) {
    const sym = h.security.symbol.toUpperCase();
    const pxP = Math.round(serverPriceFor(sym) * 100); // fixed
    const valP = pxP * Number(h.quantity);
    holdingsByAccountValueP[h.accountId] =
      (holdingsByAccountValueP[h.accountId] || 0) + valP;
  }

  // Compute totals per account (cash + holdings for investments)
  const displayTotalById: Record<string, number> = {};
  for (const a of accounts) {
    if (a.type === "INVESTMENT") {
      displayTotalById[a.id] = a.balance + (holdingsByAccountValueP[a.id] || 0);
    } else {
      displayTotalById[a.id] = a.balance;
    }
  }

  // Net worth
  const netWorth = accounts.reduce(
    (s, a) => s + (displayTotalById[a.id] || 0),
    0
  );

  // Latest incomes for the IncomeSummary widget
  const latestReturns = (txDb ?? []).find((t) =>
    /Monthly returns/i.test(t.description)
  );
  const latestDivs = (txDb ?? []).find((t) => /Dividends/i.test(t.description));
  const monthlyReturnsP = latestReturns?.amount ?? 0;
  const monthlyDividendsP = latestDivs?.amount ?? 0;

  // Recent transactions (now include status & adminMessage)
  const txns: ClientTxn[] = (txDb ?? []).slice(0, 12).map((t) => ({
    id: t.id,
    postedAt: t.postedAt.toISOString(),
    description: t.description,
    amount: t.amount,
    accountName: t.account.name,
    status: (t as any).status, // TxStatus enum in schema
    adminMessage: (t as any).adminMessage ?? null,
  }));

  // Sparkline
  const sparkSeries = (() => {
    const base = netWorth;
    if (!(txDb ?? []).length) return [base, base];
    const seq = [...txDb].reverse().map((t) => t.amount);
    const start = base - seq.reduce((s, v) => s + v, 0) * 0.2;
    const acc: number[] = [start];
    for (let i = 0; i < seq.length; i++) acc.push(acc[acc.length - 1] + seq[i]);
    return acc.slice(-16);
  })();

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-barclays-navy">Dashboard</h1>
          <div className="min-w-0 max-w-full overflow-hidden">
            <StocksTicker
              symbols={
                holdings.length
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
              <div className="text-sm text-gray-600">
                Welcome back, <span className="font-medium">{displayName}</span>
              </div>
              <div className="mt-1 text-2xl md:text-3xl font-semibold text-barclays-navy">
                Net worth {fmtGBP(netWorth)}
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

        {/* Market widget */}
        <div className="overflow-hidden rounded-2xl">
          <StocksMultiChart accounts={accounts} />
        </div>

        {/* Investments */}
        <InvestSection accountsAll={accounts} holdings={holdings} />

        {/* Your accounts */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-barclays-navy">
              Your accounts
            </div>
          </div>

          {/* Mobile scroller */}
          <div className="mt-3 md:hidden">
            <div
              className="overflow-x-auto overscroll-x-contain touch-pan-x"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex gap-3 pb-2">
                {accounts.map((a) => {
                  const totalP = displayTotalById[a.id] ?? a.balance;
                  const holdingsP = Math.max(0, totalP - a.balance);
                  const isInvest = a.type === "INVESTMENT";
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
                })}
              </div>
            </div>
          </div>

          {/* Desktop grid */}
          <div className="mt-3 hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((a) => {
              const totalP = displayTotalById[a.id] ?? a.balance;
              const holdingsP = Math.max(0, totalP - a.balance);
              const isInvest = a.type === "INVESTMENT";
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

        {/* Recent activity (now shows status badge + optional adminMessage) */}
        <section className="card overflow-hidden">
          <div className="font-semibold mb-3">Recent activity</div>
          <div className="divide-y">
            {txns.length ? (
              txns.map((t) => (
                <div
                  key={t.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 font-medium truncate">
                      <span className="truncate">{t.description}</span>
                      {t.status && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide border ${badge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      )}
                    </div>
                    {t.adminMessage && (
                      <div className="text-xs text-red-700 truncate">
                        {t.adminMessage}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {fmtDT(t.postedAt)} · {t.accountName}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      t.amount < 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    £{(Math.abs(t.amount) / 100).toFixed(2)}{" "}
                    {t.amount < 0 ? "out" : "in"}
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
      </div>
    </div>
  );
}

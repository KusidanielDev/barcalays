// FILE: src/app/app/accounts/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

/** ---------- Formatters ---------- */
const fmtGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    (pence ?? 0) / 100
  );
const fmtDT = (d: Date) =>
  d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** ---------- Deterministic price anchors (for PL table only) ---------- */
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
  return Math.max(0.5, BASE[sym] ?? 100); // fixed so PL table is stable
}

/** ---------- EXACT display totals by NAME (your requested balances) ---------- */
const DISPLAY_TOTALS_BY_NAME: Record<string, number> = {
  "Savings Account": Math.round(10_000 * 100),
  "Investment Account EM Ltd": Math.round(20_000 * 100),
  "General Investment (Informa PLC & ENM)": Math.round(1_415_896 * 100),
};

export default async function AccountDetail({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) notFound();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) notFound();

  const account = await prisma.account.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!account) notFound();

  const isInvest = account.type === "INVESTMENT";

  // Load holdings (for the info table; headline balance will use DISPLAY_TOTALS_BY_NAME)
  const holdings = isInvest
    ? await prisma.holding.findMany({
        where: { accountId: account.id },
        include: { security: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  // Compute holdings MV & P/L (for table only)
  let holdingsMV = 0;
  const rows = holdings.map((h) => {
    const qty = Number(h.quantity as any);
    const sym = h.security.symbol.toUpperCase();
    const pxP = Math.round(serverPriceFor(sym) * 100);
    const valP = pxP * qty;
    const pnlP = (pxP - h.avgCostP) * qty;
    holdingsMV += valP;
    return {
      id: h.id,
      sym,
      name: h.security.name,
      qty,
      avgP: h.avgCostP,
      pxP,
      valP,
      pnlP,
      updatedAt: h.updatedAt,
    };
  });

  // ---------- Use EXACT display total by name (fallback to cash+MV if not mapped) ----------
  const mapped = DISPLAY_TOTALS_BY_NAME[account.name];
  const displayTotalP =
    typeof mapped === "number" ? mapped : account.balance + holdingsMV;

  // Breakdown shown under the big number (so it still adds up to the displayed total)
  const displayHoldingsP = Math.max(0, displayTotalP - account.balance);

  const tx = await prisma.transaction.findMany({
    where: { accountId: account.id },
    orderBy: { postedAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-screen-lg px-4 md:px-6 py-6 space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-barclays-navy">
          Account details
        </h1>
        <div className="flex gap-2">
          <Link className="btn-secondary" href="/app/accounts">
            All accounts
          </Link>
          <Link
            className="btn-secondary"
            href={`/app/transactions?account=${account.id}`}
          >
            View all transactions
          </Link>
        </div>
      </div>

      {/* Summary card */}
      <div className="card">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Name</div>
            <div className="font-semibold">{account.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Type</div>
            <div className="font-semibold">{account.type}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Number</div>
            <div className="font-semibold">{account.number}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Sort code</div>
            <div className="font-semibold">{account.sortCode ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Currency</div>
            <div className="font-semibold">{account.currency}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Balance</div>
            {/* Show your exact total here */}
            <div className="text-2xl font-semibold">
              {fmtGBP(displayTotalP)}
            </div>
            {isInvest && (
              <div className="text-xs text-gray-600 mt-1">
                Cash {fmtGBP(account.balance)} • Holdings{" "}
                {fmtGBP(displayHoldingsP)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Holdings (investment only) */}
      {isInvest && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-barclays-navy">Holdings</div>
            <div className="text-sm text-gray-600">
              Market value {fmtGBP(holdingsMV)}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.length === 0 ? (
              <div className="text-sm text-gray-600">No holdings</div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{r.sym}</div>
                    <div
                      className={`text-sm font-medium ${
                        r.pnlP >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {r.pnlP >= 0 ? "+" : ""}
                      {fmtGBP(r.pnlP)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{r.name}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">Qty</div>
                      <div className="font-medium">{r.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500">Value</div>
                      <div className="font-medium">{fmtGBP(r.valP)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg cost</div>
                      <div className="font-medium">{fmtGBP(r.avgP)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500">Est. price</div>
                      <div className="font-medium">{fmtGBP(r.pxP)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            {rows.length === 0 ? (
              <div className="text-sm text-gray-600">No holdings</div>
            ) : (
              <table className="min-w-[820px] w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">Symbol</th>
                    <th>Name</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg cost</th>
                    <th className="text-right">Est. price</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 font-medium">{r.sym}</td>
                      <td className="truncate pr-2">{r.name}</td>
                      <td className="text-right">{r.qty}</td>
                      <td className="text-right">{fmtGBP(r.avgP)}</td>
                      <td className="text-right">{fmtGBP(r.pxP)}</td>
                      <td className="text-right">{fmtGBP(r.valP)}</td>
                      <td
                        className={`text-right font-medium ${
                          r.pnlP >= 0 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {r.pnlP >= 0 ? "+" : ""}
                        {fmtGBP(r.pnlP)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t">
                    <td className="py-2 font-medium" colSpan={5}>
                      Total
                    </td>
                    <td className="text-right font-semibold">
                      {fmtGBP(holdingsMV)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="card overflow-x-auto">
        <div className="font-semibold text-barclays-navy mb-2">
          Recent transactions
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {tx.length ? (
              tx.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="py-2 whitespace-nowrap">
                    {fmtDT(new Date(t.postedAt))}
                  </td>
                  <td className="pr-2">{t.description}</td>
                  <td
                    className={`text-right ${
                      t.amount < 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {fmtGBP(t.amount)}
                  </td>
                  <td className="text-right">
                    {t.balanceAfter != null ? fmtGBP(t.balanceAfter) : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 text-gray-600" colSpan={4}>
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

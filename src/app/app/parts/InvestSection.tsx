// FILE: src/app/app/parts/InvestSection.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ClientAccount = {
  id: string;
  name: string;
  type: string; // "INVESTMENT" | "SAVINGS" | etc.
  number: string;
  balance: number; // pence (cash)
  currency: string;
};
type ClientHolding = {
  id: string;
  accountId: string;
  quantity: number;
  avgCostP: number; // pence
  updatedAt: string;
  security: { symbol: string; name: string; currency: string };
  account: { id: string; name: string };
};

type Quote = {
  symbol: string;
  priceP: number; // pence
  changeP: number; // pence
  changePct: number;
  asOf: string;
};

const AVAILABLE_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "NVDA",
  "VUSA",
  "LGEN",
  "HSBA",
  "BP",
  "SHEL",
  "BARC",
  "RIO",
  "VOD",
  "INF",
  "ENM",
];

export default function InvestSection({
  accountsAll = [],
  holdings = [],
}: {
  accountsAll?: ClientAccount[];
  holdings?: ClientHolding[];
}) {
  const router = useRouter();

  // separate investment vs non-investment (e.g., Savings)
  const investAccs = React.useMemo(
    () => (accountsAll || []).filter((a) => a.type === "INVESTMENT"),
    [accountsAll]
  );
  const cashAccs = React.useMemo(
    () => (accountsAll || []).filter((a) => a.type !== "INVESTMENT"),
    [accountsAll]
  );

  // state
  const [accs, setAccs] = React.useState<ClientAccount[]>(investAccs);
  const [holds, setHolds] = React.useState<ClientHolding[]>(holdings);

  React.useEffect(() => setAccs(investAccs), [investAccs]);
  React.useEffect(() => setHolds(holdings || []), [holdings]);

  const heldSyms = React.useMemo(
    () =>
      Array.from(new Set(holds.map((h) => h.security.symbol.toUpperCase()))),
    [holds]
  );
  const symbolOptions = React.useMemo(
    () => Array.from(new Set([...heldSyms, ...AVAILABLE_SYMBOLS])).sort(),
    [heldSyms]
  );

  const [accountId, setAccountId] = React.useState<string>(accs[0]?.id || "");
  React.useEffect(() => {
    if (!accountId && accs[0]?.id) setAccountId(accs[0].id);
  }, [accs, accountId]);

  const initialSymbol = holds[0]?.security.symbol.toUpperCase() || "INF";
  const [selectedSymbol, setSelectedSymbol] =
    React.useState<string>(initialSymbol);
  const [qtyBySymbol, setQtyBySymbol] = React.useState<Record<string, string>>({
    [initialSymbol]: "1",
  });

  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [submitting, setSubmitting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const pollSymbols = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of heldSyms) set.add(s);
    if (selectedSymbol) set.add(selectedSymbol.toUpperCase());
    return Array.from(set);
  }, [heldSyms, selectedSymbol]);

  async function loadQuotes() {
    if (!pollSymbols.length) return setQuotes([]);
    try {
      const res = await fetch("/api/invest/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ symbols: pollSymbols }),
      });
      const j = await res.json();
      const arr = j?.quotes ?? j;
      if (Array.isArray(arr)) setQuotes(arr as Quote[]);
    } catch {}
  }

  React.useEffect(() => {
    loadQuotes();
    const id = setInterval(loadQuotes, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollSymbols.join(",")]);

  const qmap = React.useMemo(() => {
    const m: Record<string, Quote> = {};
    for (const q of quotes) m[q.symbol.toUpperCase()] = q;
    return m;
  }, [quotes]);

  // Live portfolio value (market value) by account (for dropdown totals)
  const portByAccP = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of holds) {
      const sym = h.security.symbol.toUpperCase();
      const priceP = qmap[sym]?.priceP ?? h.avgCostP;
      const valueP = Math.round(Number(h.quantity) * priceP);
      m[h.accountId] = (m[h.accountId] || 0) + valueP;
    }
    return m;
  }, [holds, qmap]);

  // currency helpers
  function ccy(cur: string) {
    switch (cur) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
      default:
        return "£";
    }
  }
  const fmt = (pence: number, cur: string = "GBP") =>
    `${ccy(cur)}${((pence ?? 0) / 100).toFixed(2)}`;

  async function place(symRaw: string, side: "BUY" | "SELL") {
    setError(null);
    const sym = symRaw?.toUpperCase();
    const qtyN = Number(qtyBySymbol[sym] ?? "1");
    if (!(qtyN > 0)) return setError("Enter a valid quantity > 0");
    if (!accountId) return setError("Select an investment account");
    const key = `${sym}:${side}`;
    setSubmitting(key);
    try {
      const res = await fetch("/api/invest/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ accountId, symbol: sym, side, quantity: qtyN }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Order failed");

      // Update cash on the chosen investment account
      setAccs((prev) =>
        prev.map((a) =>
          a.id === accountId
            ? { ...a, balance: j.newBalance ?? j.account?.balance ?? a.balance }
            : a
        )
      );

      // Ensure traded symbol has a fresh quote
      if (j.execPricePence && j.symbol) {
        const upSym = String(j.symbol).toUpperCase();
        setQuotes((prev) => {
          const others = prev.filter((q) => q.symbol.toUpperCase() !== upSym);
          const prevQ = prev.find((q) => q.symbol.toUpperCase() === upSym);
          const priceP = Number(j.execPricePence);
          const changeP = prevQ ? priceP - prevQ.priceP : 0;
          const changePct =
            prevQ && prevQ.priceP ? (changeP / prevQ.priceP) * 100 : 0;
          return [
            ...others,
            {
              symbol: upSym,
              priceP,
              changeP,
              changePct,
              asOf: new Date().toISOString(),
            },
          ];
        });
      }

      // Optimistic holding update
      const execPriceP = Number(j.execPricePence ?? qmap[sym]?.priceP ?? 0);
      setHolds((prev) => {
        const idx = prev.findIndex(
          (h) =>
            h.security.symbol.toUpperCase() === sym && h.accountId === accountId
        );
        if (side === "BUY") {
          if (idx >= 0) {
            const h = prev[idx];
            const nextQty = Number(h.quantity) + qtyN;
            const next: ClientHolding = {
              ...h,
              quantity: nextQty,
              updatedAt: new Date().toISOString(),
            };
            return [...prev.slice(0, idx), next, ...prev.slice(idx + 1)];
          } else {
            const acc = investAccs.find((a) => a.id === accountId)!;
            const newH: ClientHolding = {
              id: `temp-${Date.now()}`,
              accountId,
              quantity: qtyN,
              avgCostP: execPriceP || 0,
              updatedAt: new Date().toISOString(),
              security: { symbol: sym, name: sym, currency: "GBP" },
              account: { id: acc.id, name: acc.name },
            };
            return [newH, ...prev];
          }
        } else {
          if (idx >= 0) {
            const h = prev[idx];
            const nextQty = Math.max(0, Number(h.quantity) - qtyN);
            if (nextQty === 0)
              return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
            const next: ClientHolding = {
              ...h,
              quantity: nextQty,
              updatedAt: new Date().toISOString(),
            };
            return [...prev.slice(0, idx), next, ...prev.slice(idx + 1)];
          }
          return prev;
        }
      });

      setNotice(`Order placed: ${side} ${qtyN} ${sym}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Trade failed");
    } finally {
      setSubmitting(null);
      loadQuotes();
      setTimeout(() => setNotice(null), 3000);
    }
  }

  // ---- UI ----
  return (
    <section className="space-y-4">
      {/* Quick trade (investment accounts only) */}
      <div className="card">
        <div className="font-semibold text-barclays-navy">Quick trade</div>

        {accs.length === 0 ? (
          <div className="mt-2 text-sm text-gray-600">
            No investment account yet. Create one to start trading.
          </div>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="block">
                <div className="text-xs text-gray-600 mb-1">Account</div>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  {accs.map((a) => {
                    const portP = portByAccP[a.id] || 0;
                    const totalP = a.balance + portP;
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} • {a.number.slice(-4)} • Cash{" "}
                        {fmt(a.balance, a.currency)} • Total{" "}
                        {fmt(totalP, a.currency)}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block">
                <div className="text-xs text-gray-600 mb-1">Symbol</div>
                <select
                  value={selectedSymbol}
                  onChange={(e) => {
                    const sym = e.target.value.toUpperCase();
                    setSelectedSymbol(sym);
                    setQtyBySymbol((m) => ({ ...m, [sym]: m[sym] ?? "1" }));
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  {symbolOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="text-xs text-gray-600 mb-1">Quantity</div>
                <input
                  inputMode="numeric"
                  pattern="\\d*"
                  value={qtyBySymbol[selectedSymbol] ?? "1"}
                  onChange={(e) =>
                    setQtyBySymbol((m) => ({
                      ...m,
                      [selectedSymbol]: e.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => place(selectedSymbol, "BUY")}
                disabled={!!submitting}
                className={`btn-primary ${
                  submitting?.endsWith(":BUY") ? "opacity-60" : ""
                }`}
              >
                {submitting?.endsWith(":BUY") ? "Placing…" : "Buy"}
              </button>
              <button
                onClick={() => place(selectedSymbol, "SELL")}
                disabled={!!submitting}
                className={`btn-secondary ${
                  submitting?.endsWith(":SELL") ? "opacity-60" : ""
                }`}
              >
                {submitting?.endsWith(":SELL") ? "Placing…" : "Sell"}
              </button>
            </div>
          </>
        )}

        {error ? (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        ) : null}
        {notice ? (
          <div className="mt-2 text-sm text-green-700">{notice}</div>
        ) : null}
      </div>

      {/* Current holdings (now includes a Cash row/card for each non-investment account, e.g., Savings) */}
      <div className="card">
        <div className="font-semibold text-barclays-navy">Current holdings</div>

        {/* Mobile: horizontal cards */}
        <div className="-mx-4 px-4 mt-3 overflow-x-auto md:hidden snap-x snap-mandatory">
          <div className="flex gap-3 pb-2">
            {/* Equity/fund holdings */}
            {holds.map((h) => {
              const sym = h.security.symbol.toUpperCase();
              const q = qmap[sym];
              const pct = q?.changePct ?? 0;
              const isUp = pct >= 0;
              const color = isUp ? "text-green-700" : "text-red-600";
              const ring = isUp
                ? "ring-1 ring-green-200"
                : "ring-1 ring-red-200";
              const priceP = q?.priceP ?? h.avgCostP;
              const valueP = Math.round(Number(h.quantity) * priceP);
              return (
                <div
                  key={h.id}
                  className={`min-w-[260px] snap-center rounded-2xl border p-4 ${ring}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{sym}</div>
                    <div className={`text-xs font-medium ${color}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{h.security.name}</div>
                  <div className="mt-2 text-lg font-semibold">
                    {fmt(priceP, h.security.currency)}{" "}
                    <span className="text-sm text-gray-500">/sh</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Qty {Number(h.quantity)} • Value{" "}
                    {fmt(valueP, h.security.currency)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => place(sym, "BUY")}
                      className="btn-primary"
                      disabled={!!submitting}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => place(sym, "SELL")}
                      className="btn-secondary"
                      disabled={!!submitting}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Cash accounts (e.g., Savings) */}
            {cashAccs.map((a) => (
              <div
                key={`cash-${a.id}`}
                className="min-w-[260px] snap-center rounded-2xl border p-4 ring-1 ring-sky-200"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">CASH</div>
                  <div className="text-xs font-medium text-sky-700">Stable</div>
                </div>
                <div className="text-sm text-gray-600">{a.name}</div>
                <div className="mt-2 text-lg font-semibold">
                  {fmt(a.balance, a.currency)}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Account • {a.number}
                </div>
                <div className="mt-3">
                  <Link
                    href={`/app/accounts/${a.id}`}
                    className="btn-secondary"
                  >
                    View account
                  </Link>
                </div>
              </div>
            ))}

            {!holds.length && !cashAccs.length && (
              <div className="text-sm text-gray-600">
                No holdings yet. Use Quick trade to buy your first stock.
              </div>
            )}
          </div>
        </div>

        {/* Desktop: table */}
        <div className="mt-3 overflow-x-auto hidden md:block">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Account</th>
                <th>Symbol</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg cost</th>
                <th className="text-right">Price</th>
                <th className="text-right">Day %</th>
                <th className="text-right">Value</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Equity/fund holdings */}
              {holds.map((h) => {
                const sym = h.security.symbol.toUpperCase();
                const q = qmap[sym];
                const priceP = q?.priceP ?? h.avgCostP;
                const pct = q?.changePct ?? 0;
                const isUp = pct >= 0;
                const color = isUp ? "text-green-700" : "text-red-600";
                const valueP = Math.round(Number(h.quantity) * priceP);
                const kBuy = `${sym}:BUY`,
                  kSell = `${sym}:SELL`;
                return (
                  <tr key={h.id} className="border-t">
                    <td className="py-2">{h.account.name}</td>
                    <td className="font-medium">{sym}</td>
                    <td className="text-right">{Number(h.quantity)}</td>
                    <td className="text-right">
                      {fmt(h.avgCostP, h.security.currency)}
                    </td>
                    <td className="text-right">
                      {fmt(priceP, h.security.currency)}
                    </td>
                    <td className={`text-right font-medium ${color}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                    </td>
                    <td className="text-right">
                      {fmt(valueP, h.security.currency)}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => place(sym, "BUY")}
                          disabled={submitting === kBuy}
                          className={`btn-primary ${
                            submitting === kBuy ? "opacity-60" : ""
                          }`}
                        >
                          {submitting === kBuy ? "Placing…" : "Buy"}
                        </button>
                        <button
                          onClick={() => place(sym, "SELL")}
                          disabled={submitting === kSell}
                          className={`btn-secondary ${
                            submitting === kSell ? "opacity-60" : ""
                          }`}
                        >
                          {submitting === kSell ? "Placing…" : "Sell"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Cash accounts */}
              {cashAccs.map((a) => (
                <tr key={`cash-row-${a.id}`} className="border-t bg-sky-50/40">
                  <td className="py-2">{a.name}</td>
                  <td className="font-medium">CASH</td>
                  <td className="text-right">—</td>
                  <td className="text-right">—</td>
                  <td className="text-right">—</td>
                  <td className="text-right">—</td>
                  <td className="text-right">{fmt(a.balance, a.currency)}</td>
                  <td className="text-right">
                    <Link
                      href={`/app/accounts/${a.id}`}
                      className="btn-secondary"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {!holds.length && !cashAccs.length && (
                <tr>
                  <td colSpan={8} className="py-3 text-gray-600">
                    No holdings yet. Use Quick trade to buy your first stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// FILE: src/app/app/parts/InvestSection.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type ClientAccount = {
  id: string;
  name: string;
  type: string;
  number: string;
  balance: number; // pence
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
  price: number;
  change: number;
  currency: string;
};

const DEFAULTS = ["AAPL", "TSLA", "VUSA", "MSFT", "AMZN"];

export default function InvestSection({
  accounts,
  holdings,
}: {
  accounts: ClientAccount[];
  holdings: ClientHolding[];
}) {
  const router = useRouter();
  const investAccountsInitial = accounts.filter((a) => a.type === "INVESTMENT");

  // local, live copies so UI updates immediately after successful orders
  const [accs, setAccs] = React.useState<ClientAccount[]>(
    investAccountsInitial
  );
  const [holds, setHolds] = React.useState<ClientHolding[]>(holdings);

  const [accountId, setAccountId] = React.useState<string>(accs[0]?.id || "");
  const [qty, setQty] = React.useState<Record<string, string>>({});
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [submitting, setSubmitting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const syms = React.useMemo(() => {
    const have = Array.from(new Set(holds.map((h) => h.security.symbol)));
    const pool = Array.from(new Set([...have, ...DEFAULTS]));
    return pool.slice(0, 8);
  }, [holds]);

  async function loadQuotes() {
    try {
      const res = await fetch(
        `/api/quotes?symbols=${encodeURIComponent(syms.join(","))}`,
        {
          cache: "no-store",
        }
      );
      const data = (await res.json()) as Quote[];
      setQuotes(data);
    } catch {
      // ignore
    }
  }

  React.useEffect(() => {
    loadQuotes();
    const id = setInterval(loadQuotes, 6000);
    return () => clearInterval(id);
  }, [syms.join(",")]);

  const qmap = React.useMemo(() => {
    const m: Record<string, Quote> = {};
    for (const q of quotes) m[q.symbol] = q;
    return m;
  }, [quotes]);

  async function place(symbol: string, side: "BUY" | "SELL") {
    setError(null);
    setNotice(null);
    if (!accountId) {
      setError("Choose an investment account first.");
      return;
    }
    const n = Number(qty[symbol] ?? "0");
    if (!(n > 0)) {
      setError("Enter a valid quantity > 0");
      return;
    }

    const key = `${symbol}:${side}`;
    setSubmitting(key);
    try {
      const res = await fetch("/api/invest/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          symbol,
          side,
          quantity: n,
          orderType: "MARKET",
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setError(j.error || "Trade failed");
        return;
      }

      // Update local account balance
      setAccs((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, balance: j.account.balance } : a
        )
      );

      // Update or insert holding locally so the “Current holdings” table changes immediately
      setHolds((prev) => {
        const idx = prev.findIndex(
          (h) => h.accountId === accountId && h.security.symbol === symbol
        );
        // price we used for the order (approx from current quote)
        const q = qmap[symbol];
        const priceP = q ? Math.round(q.price * 100) : 0;

        if (side === "BUY") {
          if (idx >= 0) {
            const cur = prev[idx];
            const newQty = cur.quantity + n;
            // simple avg cost recompute
            const totalCost = cur.avgCostP * cur.quantity + priceP * n;
            const newAvg = Math.floor(totalCost / Math.max(1, newQty));
            const next = {
              ...cur,
              quantity: newQty,
              avgCostP: newAvg,
              updatedAt: new Date().toISOString(),
            };
            return [...prev.slice(0, idx), next, ...prev.slice(idx + 1)];
          } else {
            const newH: ClientHolding = {
              id: `tmp-${crypto.randomUUID()}`,
              accountId,
              quantity: n,
              avgCostP: priceP,
              updatedAt: new Date().toISOString(),
              security: {
                symbol,
                name: symbol,
                currency: q?.currency || "GBP",
              },
              account: {
                id: accountId,
                name:
                  accs.find((a) => a.id === accountId)?.name || "Investment",
              },
            };
            return [newH, ...prev];
          }
        } else {
          // SELL
          if (idx >= 0) {
            const cur = prev[idx];
            const newQty = Math.max(0, cur.quantity - n);
            if (newQty === 0) {
              return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
            }
            const next = {
              ...cur,
              quantity: newQty,
              updatedAt: new Date().toISOString(),
            };
            return [...prev.slice(0, idx), next, ...prev.slice(idx + 1)];
          }
          return prev;
        }
      });

      setNotice(`Order placed: ${side} ${n} ${symbol}.`);
      // (Optional) soft refresh server data for next navigation
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Trade failed");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section className="grid lg:grid-cols-2 gap-4">
      {/* Quick trade */}
      <div className="card">
        <div className="font-semibold text-barclays-navy">Quick trade</div>
        <div className="text-sm text-gray-600">
          Select account, set quantity, then Buy/Sell.
        </div>

        {error && (
          <div className="mt-3 rounded bg-red-50 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-3 rounded bg-green-50 text-green-700 p-2 text-sm">
            {notice}
          </div>
        )}

        <div className="mt-3">
          <label className="text-sm text-gray-600">Account</label>
          <select
            className="mt-1 rounded-md border px-3 py-1.5"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accs.map((a) => (
              <option value={a.id} key={a.id}>
                {a.name} · £{(a.balance / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {syms.map((sym) => {
            const q = qmap[sym];
            const busyBuy = submitting === `${sym}:BUY`;
            const busySell = submitting === `${sym}:SELL`;
            return (
              <div key={sym} className="flex items-center gap-2">
                <div className="w-20 font-medium">{sym}</div>
                <div
                  className="text-sm text-gray-600 w-24"
                  suppressHydrationWarning
                >
                  {q
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: q.currency,
                      }).format(q.price)
                    : "—"}
                </div>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="w-24 rounded-md border px-3 py-1.5"
                  placeholder="Qty"
                  value={qty[sym] || ""}
                  onChange={(e) =>
                    setQty((m) => ({ ...m, [sym]: e.target.value }))
                  }
                />
                <button
                  onClick={() => place(sym, "BUY")}
                  disabled={busyBuy}
                  className={`btn-primary ${busyBuy ? "opacity-60" : ""}`}
                >
                  {busyBuy ? "Placing…" : "Buy"}
                </button>
                <button
                  onClick={() => place(sym, "SELL")}
                  disabled={busySell}
                  className={`btn-secondary ${busySell ? "opacity-60" : ""}`}
                >
                  {busySell ? "Placing…" : "Sell"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current holdings (live from local state) */}
      <div className="card">
        <div className="font-semibold text-barclays-navy">Current holdings</div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Account</th>
                <th>Symbol</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg cost</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {holds.length ? (
                holds.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2">{h.account.name}</td>
                    <td>{h.security.symbol}</td>
                    <td className="text-right">{h.quantity}</td>
                    <td className="text-right">
                      £{(h.avgCostP / 100).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 text-gray-600">
                    No holdings yet. Use the quick trade to buy your first
                    stock.
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

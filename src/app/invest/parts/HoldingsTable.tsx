// FILE: src/app/invest/parts/HoldingsTable.tsx
"use client";
import * as React from "react";
import TradeModal from "./TradeModal";

type Account = {
  id: string;
  name: string;
  number: string;
  balance: number;
  currency: string;
};
type Holding = {
  id: string;
  accountId: string;
  quantity: any;
  avgCostP: number;
  updatedAt: string;
  security: { symbol: string; name: string; currency: string };
  account: { id: string; name: string };
};

export default function HoldingsTable({
  accounts,
  holdings,
}: {
  accounts: Account[];
  holdings: Holding[];
}) {
  const [quotes, setQuotes] = React.useState<
    Record<string, { priceP: number; changePct: number }>
  >({});
  const [trade, setTrade] = React.useState<{
    accountId: string;
    symbol: string;
    side: "BUY" | "SELL";
  } | null>(null);

  const symbols = Array.from(new Set(holdings.map((h) => h.security.symbol)));

  async function loadQuotes() {
    const res = await fetch("/api/invest/quotes", {
      method: "POST",
      body: JSON.stringify({ symbols }),
      headers: { "Content-Type": "application/json" },
    });
    const j = await res.json();
    const map: Record<string, any> = {};
    j.quotes.forEach((q: any) => {
      map[q.symbol] = q;
    });
    setQuotes(map);
  }

  React.useEffect(() => {
    if (symbols.length) {
      loadQuotes();
      const id = setInterval(loadQuotes, 7000);
      return () => clearInterval(id);
    }
  }, [symbols.join(",")]);

  function valueP(symbol: string, qty: number, avgP: number) {
    const p = quotes[symbol]?.priceP ?? avgP;
    return Math.round(p * qty);
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 border-b">
            <th className="py-2 pr-3">Holding</th>
            <th className="py-2 pr-3">Account</th>
            <th className="py-2 pr-3">Qty</th>
            <th className="py-2 pr-3">Price</th>
            <th className="py-2 pr-3">Day%</th>
            <th className="py-2 pr-3">Value</th>
            <th className="py-2 pr-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const qty = Number(h.quantity);
            const q = quotes[h.security.symbol];
            const price = q ? `£${(q.priceP / 100).toFixed(2)}` : "—";
            const day = q
              ? `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%`
              : "—";
            const v = valueP(h.security.symbol, qty, h.avgCostP);
            return (
              <tr key={h.id} className="border-b">
                <td className="py-2 pr-3 font-medium">
                  {h.security.symbol}
                  <span className="ml-2 text-gray-500">{h.security.name}</span>
                </td>
                <td className="py-2 pr-3">{h.account.name}</td>
                <td className="py-2 pr-3">{qty}</td>
                <td className="py-2 pr-3">{price}</td>
                <td
                  className={`py-2 pr-3 ${
                    q?.changePct > 0
                      ? "text-green-600"
                      : q?.changePct < 0
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {day}
                </td>
                <td className="py-2 pr-3">£{(v / 100).toFixed(2)}</td>
                <td className="py-2 pr-0 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        setTrade({
                          accountId: h.accountId,
                          symbol: h.security.symbol,
                          side: "BUY",
                        })
                      }
                    >
                      Buy
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        setTrade({
                          accountId: h.accountId,
                          symbol: h.security.symbol,
                          side: "SELL",
                        })
                      }
                    >
                      Sell
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {trade ? (
        <TradeModal
          accountId={trade.accountId}
          symbol={trade.symbol}
          side={trade.side}
          onClose={(done) => {
            setTrade(null);
            if (done) location.reload();
          }}
        />
      ) : null}
    </div>
  );
}

// FILE: src/app/app/invest/parts/InvestHubClient.tsx
"use client";

import { useMemo, useState } from "react";

type Acct = { id: string; name: string; balance: number; currency: string };

export default function InvestHubClient({ accounts }: { accounts: Acct[] }) {
  const total = useMemo(
    () => accounts.reduce((s, a) => s + (a.balance ?? 0), 0),
    [accounts]
  );

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Portfolio summary + chart */}
      <div className="lg:col-span-2 rounded-xl border p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Portfolio value</div>
            <div className="text-3xl font-semibold tabular-nums">
              £{(total / 100).toFixed(2)}
            </div>
          </div>
          <div className="text-sm">
            {accounts.length} account{accounts.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-4">
          <BigLineChart />
        </div>
      </div>

      {/* Order ticket */}
      <div className="rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d]">Trade</h3>
        <OrderTicket />
      </div>

      {/* Watchlist */}
      <div className="rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d] mb-2">Watchlist</h3>
        <WatchList />
      </div>

      {/* Market movers */}
      <div className="rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d] mb-2">
          Market movers
        </h3>
        <Movers />
      </div>

      {/* Positions (static sample) */}
      <div className="lg:col-span-2 rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d] mb-2">Positions</h3>
        <Positions />
      </div>
    </div>
  );
}

/* --- Tiny components --- */

function BigLineChart() {
  // simple sparkline-style big chart (dummy data)
  const points = [100, 110, 90, 120, 140, 135, 150, 170, 160, 180, 195, 210];
  const max = Math.max(...points),
    min = Math.min(...points);
  const norm = (v: number) => ((v - min) / (max - min)) * 100;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${100 - norm(p)}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="w-full h-44 md:h-64">
      <polyline
        fill="none"
        stroke="#00AEEF"
        strokeWidth="2"
        points={d.replace(
          /,(\d+)/g,
          (_m, y) => `,${(Number(y) / 2).toFixed(2)}`
        )}
      />
    </svg>
  );
}

function WatchList() {
  const rows = [
    { t: "AAPL", name: "Apple", px: 232.11, chg: +1.24 },
    { t: "MSFT", name: "Microsoft", px: 418.9, chg: -0.32 },
    { t: "NVDA", name: "NVIDIA", px: 122.33, chg: +2.1 },
    { t: "VOD", name: "Vodafone", px: 0.69, chg: +0.01 },
  ];
  return (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.t} className="py-2 flex items-center justify-between">
          <div>
            <div className="font-medium">{r.t}</div>
            <div className="text-xs text-gray-500">{r.name}</div>
          </div>
          <div className="text-right">
            <div className="tabular-nums">£{r.px.toFixed(2)}</div>
            <div
              className={`text-xs ${
                r.chg >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {r.chg >= 0 ? "+" : ""}
              {r.chg.toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Movers() {
  const rows = [
    { t: "TSLA", name: "Tesla", chg: +5.8 },
    { t: "META", name: "Meta", chg: +4.2 },
    { t: "AMZN", name: "Amazon", chg: -3.1 },
    { t: "BABA", name: "Alibaba", chg: -2.4 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((r) => (
        <div key={r.t} className="rounded-lg border p-3">
          <div className="font-medium">{r.t}</div>
          <div className="text-xs text-gray-500">{r.name}</div>
          <div
            className={`mt-1 font-semibold ${
              r.chg >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {r.chg >= 0 ? "▲" : "▼"} {Math.abs(r.chg).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

function Positions() {
  const rows = [
    {
      t: "VUSA",
      name: "Vanguard S&P 500 UCITS ETF",
      qty: 15,
      avg: 77.12,
      last: 82.44,
    },
    { t: "VUKE", name: "FTSE 100 UCITS ETF", qty: 20, avg: 32.01, last: 30.95 },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-500">
          <tr>
            <th className="text-left py-2">Instrument</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Avg cost</th>
            <th className="text-right">Last</th>
            <th className="text-right">P/L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pl = (r.last - r.avg) * r.qty;
            return (
              <tr key={r.t} className="border-t">
                <td className="py-2">
                  <div className="font-medium">{r.t}</div>
                  <div className="text-xs text-gray-500">{r.name}</div>
                </td>
                <td className="text-right tabular-nums">{r.qty}</td>
                <td className="text-right tabular-nums">£{r.avg.toFixed(2)}</td>
                <td className="text-right tabular-nums">
                  £{r.last.toFixed(2)}
                </td>
                <td
                  className={`text-right tabular-nums font-semibold ${
                    pl >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {pl >= 0 ? "+" : "−"}£{Math.abs(pl).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderTicket() {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState("VUSA");
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function placeOrder() {
    setPending(true);
    setMsg(null);
    const res = await fetch("/api/invest/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side, symbol, qty, type: "MARKET" }),
    });
    setPending(false);
    if (res.ok) setMsg(`${side} order placed for ${qty} ${symbol}`);
    else setMsg("Order failed");
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border overflow-hidden">
        <button
          className={`px-3 py-1.5 text-sm ${
            side === "BUY" ? "bg-green-600 text-white" : "bg-white"
          }`}
          onClick={() => setSide("BUY")}
          type="button"
        >
          Buy
        </button>
        <button
          className={`px-3 py-1.5 text-sm ${
            side === "SELL" ? "bg-red-600 text-white" : "bg-white"
          }`}
          onClick={() => setSide("SELL")}
          type="button"
        >
          Sell
        </button>
      </div>

      <div>
        <label className="block text-sm text-gray-700">Symbol</label>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g., VUSA"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700">Quantity</label>
        <input
          type="number"
          min={1}
          step={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={placeOrder}
        disabled={pending}
        className="w-full rounded-md bg-[#00395d] px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? "Placing…" : `${side} now`}
      </button>

      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  );
}

// FILE: src/app/app/invest/parts/InvestHubClientPro.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Acct = { id: string; name: string; balance: number; currency: string };

export default function InvestHubClientPro({ accounts }: { accounts: Acct[] }) {
  const total = useMemo(
    () => accounts.reduce((s, a) => s + (a.balance ?? 0), 0),
    [accounts]
  );
  const [tf, setTf] = useState<"1D" | "1W" | "1M" | "1Y">("1M");
  const [symbol, setSymbol] = useState("VUSA");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Portfolio + chart */}
      <div className="lg:col-span-2 rounded-xl border p-4 bg-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm text-gray-500">Portfolio value</div>
            <div className="text-3xl font-semibold tabular-nums">
              £{(total / 100).toFixed(2)}
            </div>
          </div>
          <div className="inline-flex rounded-lg border overflow-hidden">
            {(["1D", "1W", "1M", "1Y"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTf(k)}
                className={`px-3 py-1.5 text-sm ${
                  tf === k ? "bg-[#00AEEF] text-white" : "bg-white"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <LiveChart timeframe={tf} />
        </div>
      </div>

      {/* Ticket */}
      <div className="rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d] mb-2">Trade</h3>
        <OrderTicket accounts={accounts} symbol={symbol} />
      </div>

      {/* Watchlist & movers */}
      <div className="rounded-xl border p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#00395d]">Watchlist</h3>
          <AddWatch onAdd={(t) => setSymbol(t)} />
        </div>
        <WatchList onPick={(t) => setSymbol(t)} />
      </div>
      <div className="rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d] mb-2">
          Market movers
        </h3>
        <Movers onPick={(t) => setSymbol(t)} />
      </div>

      {/* Positions */}
      <div className="lg:col-span-2 rounded-xl border p-4 bg-white">
        <h3 className="text-lg font-semibold text-[#00395d] mb-2">Positions</h3>
        <Positions />
      </div>
    </div>
  );
}

/* --------- Widgets --------- */

function LiveChart({ timeframe }: { timeframe: "1D" | "1W" | "1M" | "1Y" }) {
  // simple streaming line via SVG polyline
  const [points, setPoints] = useState<number[]>(() => makeSeries(timeframe));
  const tfRef = useRef(timeframe);

  useEffect(() => {
    tfRef.current = timeframe;
  }, [timeframe]);

  useEffect(() => {
    setPoints(makeSeries(timeframe));
  }, [timeframe]);

  useEffect(() => {
    const id = setInterval(() => {
      // push a new point with small drift
      setPoints((prev) => {
        const last = prev[prev.length - 1] ?? 100;
        const noise =
          Math.sin(prev.length / 5) * 0.5 + (Math.random() - 0.5) * 0.6;
        const drift =
          tfRef.current === "1D"
            ? 0.03
            : tfRef.current === "1W"
            ? 0.06
            : tfRef.current === "1M"
            ? 0.1
            : 0.2;
        const next = Math.max(90, last + noise + drift);
        const maxLen =
          tfRef.current === "1D"
            ? 60
            : tfRef.current === "1W"
            ? 80
            : tfRef.current === "1M"
            ? 120
            : 160;
        const arr = [...prev, next];
        return arr.length > maxLen ? arr.slice(arr.length - maxLen) : arr;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(...points),
    min = Math.min(...points);
  const norm = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const pts = points
    .map((p, i) => `${(i / (points.length - 1 || 1)) * 100},${100 - norm(p)}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="w-full h-44 md:h-64">
      <polyline
        fill="none"
        stroke="#00AEEF"
        strokeWidth="2"
        points={pts.replace(
          /,(\d+(\.\d+)?)/g,
          (_m, y) => `,${(Number(y) / 2).toFixed(2)}`
        )}
      />
    </svg>
  );
}

function makeSeries(tf: "1D" | "1W" | "1M" | "1Y") {
  const len = tf === "1D" ? 60 : tf === "1W" ? 80 : tf === "1M" ? 120 : 160;
  return Array.from({ length: len }, (_, i) => {
    const base = 100;
    const drift =
      i * (tf === "1D" ? 0.03 : tf === "1W" ? 0.06 : tf === "1M" ? 0.1 : 0.2);
    const noise = Math.sin(i / 3) * 0.9 + Math.cos(i / 7) * 0.5;
    return base + drift + noise;
  });
}

function AddWatch({ onAdd }: { onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={v}
        onChange={(e) => setV(e.target.value.toUpperCase())}
        placeholder="Ticker"
        className="w-24 rounded-md border px-2 py-1 text-sm"
      />
      <button
        onClick={() => v && onAdd(v)}
        className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
      >
        Add
      </button>
    </div>
  );
}

function WatchList({ onPick }: { onPick: (t: string) => void }) {
  const rows = [
    { t: "AAPL", name: "Apple", px: 232.11, chg: +1.24 },
    { t: "MSFT", name: "Microsoft", px: 418.9, chg: -0.32 },
    { t: "NVDA", name: "NVIDIA", px: 122.33, chg: +2.1 },
    { t: "VUSA", name: "Vanguard S&P 500 ETF", px: 82.44, chg: +0.4 },
  ];
  return (
    <div className="divide-y">
      {rows.map((r) => (
        <button
          key={r.t}
          onClick={() => onPick(r.t)}
          className="w-full text-left py-2 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg"
        >
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
        </button>
      ))}
    </div>
  );
}

function Movers({ onPick }: { onPick: (t: string) => void }) {
  const rows = [
    { t: "TSLA", name: "Tesla", chg: +5.8 },
    { t: "META", name: "Meta", chg: +4.2 },
    { t: "AMZN", name: "Amazon", chg: -3.1 },
    { t: "BABA", name: "Alibaba", chg: -2.4 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((r) => (
        <button
          key={r.t}
          onClick={() => onPick(r.t)}
          className="text-left rounded-lg border p-3 hover:bg-gray-50"
        >
          <div className="font-medium">{r.t}</div>
          <div className="text-xs text-gray-500">{r.name}</div>
          <div
            className={`mt-1 font-semibold ${
              r.chg >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {r.chg >= 0 ? "▲" : "▼"} {Math.abs(r.chg).toFixed(1)}%
          </div>
        </button>
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

function OrderTicket({
  accounts,
  symbol: initialSymbol,
}: {
  accounts: Acct[];
  symbol: string;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [qty, setQty] = useState<number>(1);
  const [acct, setAcct] = useState<string>(accounts[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function placeOrder() {
    if (!acct || !symbol || qty < 1) {
      setMsg("Please choose account, symbol and quantity.");
      return;
    }
    setPending(true);
    setMsg(null);
    const res = await fetch("/api/invest/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        side,
        symbol: symbol.toUpperCase(),
        qty,
        accountId: acct,
        type: "MARKET",
      }),
    });
    setPending(false);
    if (res.ok) setMsg(`${side} ${qty} ${symbol.toUpperCase()} — submitted`);
    else {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Order failed");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-700">Account</label>
        <select
          value={acct}
          onChange={(e) => setAcct(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

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

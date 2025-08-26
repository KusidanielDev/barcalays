// FILE: src/app/app/parts/StocksMultiChart.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const SYMBOLS = ["TSLA", "AAPL", "NVDA", "MSFT", "INF"] as const;
type Sym = (typeof SYMBOLS)[number];

type ClientAccount = {
  id: string;
  name: string; // e.g. "Investment Account EM Ltd"
  type: string; // "INVESTMENT" | "SAVINGS" | ...
  number: string; // display only
  balance: number; // pence
  currency: string; // e.g. "GBP"
};

// Synthetic anchors (replace with real quotes later if desired)
const BASE: Record<Sym, number> = {
  TSLA: 239.55,
  AAPL: 189.12,
  NVDA: 122.55,
  MSFT: 430.25,
  INF: 8.5,
};

function priceAt(sym: Sym, t: number) {
  const b = BASE[sym];
  const k1 = { TSLA: 6800, AAPL: 7200, NVDA: 6500, MSFT: 7500, INF: 9000 }[sym];
  const k2 = { TSLA: 11000, AAPL: 13000, NVDA: 10000, MSFT: 12000, INF: 15000 }[
    sym
  ];
  const a1 = { TSLA: 0.65, AAPL: 0.45, NVDA: 0.75, MSFT: 0.35, INF: 0.15 }[sym];
  const a2 = { TSLA: 0.3, AAPL: 0.25, NVDA: 0.35, MSFT: 0.22, INF: 0.08 }[sym];
  const wave =
    Math.sin(Math.floor(t / k1)) * a1 + Math.cos(Math.floor(t / k2)) * a2;
  const micro = ((t % 10_000) / 10_000 - 0.5) * 0.35;
  return Math.max(0.5, b + wave + micro);
}

const fmtGBP = (n: number) => `£${n.toFixed(2)}`;

function linePath(values: number[], width = 340, height = 120, pad = 8) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-9, max - min);
  const W = width - pad * 2;
  const H = height - pad * 2;
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const y = (v: number) => pad + H - ((v - min) / span) * H;
  const x = (i: number) => pad + i * step;
  let d = `M ${x(0)} ${y(values[0])}`;
  for (let i = 1; i < values.length; i++) d += ` L ${x(i)} ${y(values[i])}`;
  return d;
}

export default function StocksMultiChart({
  symbols,
  accounts, // REQUIRED: pass server-fetched accounts
}: {
  symbols?: ReadonlyArray<Sym>;
  accounts: ClientAccount[];
}) {
  const router = useRouter();
  const list = symbols ?? SYMBOLS;

  // build series once + update every 5s
  const [active, setActive] = React.useState<Sym>(
    (list[0] ?? SYMBOLS[0]) as Sym
  );
  const [seriesBy, setSeriesBy] = React.useState<Record<string, number[]>>({});

  React.useEffect(() => {
    const t = Date.now();
    const init: Record<string, number[]> = {};
    for (const s of list) {
      const pts: number[] = [];
      for (let i = 30; i >= 0; i--) pts.push(priceAt(s as Sym, t - i * 60_000));
      init[s] = pts;
    }
    setSeriesBy(init);
    const id = setInterval(() => {
      setSeriesBy((prev) => {
        const next: Record<string, number[]> = {};
        for (const s of list) {
          const arr = prev[s] ?? [];
          next[s] = arr.length
            ? [...arr.slice(1), priceAt(s as Sym, Date.now())]
            : [priceAt(s as Sym, Date.now())];
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [JSON.stringify(list)]);

  // prices
  const current = seriesBy[active] ?? [];
  const last = current[current.length - 1] ?? priceAt(active, Date.now());
  const prev = current[current.length - 2] ?? last;
  const ch = last - prev;
  const pct = prev ? (ch / prev) * 100 : 0;
  const spread = last * 0.001; // 10 bps
  const buyPx = last + spread; // ask
  const sellPx = last - spread; // bid
  const color = ch >= 0 ? "#15803d" : "#dc2626";
  const gradId = `grad-${active}`;

  // accounts
  const investAccounts = React.useMemo(
    () => (accounts || []).filter((a) => a.type === "INVESTMENT"),
    [accounts]
  );
  const [accountId, setAccountId] = React.useState<string>("");
  React.useEffect(() => {
    if (!accountId && investAccounts.length) setAccountId(investAccounts[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investAccounts.length]);

  // trade
  const [qty, setQty] = React.useState("1");
  const [submitting, setSubmitting] = React.useState<null | "BUY" | "SELL">(
    null
  );
  const [msg, setMsg] = React.useState<{ ok?: string; err?: string } | null>(
    null
  );

  const disabled = !accountId || !investAccounts.length;

  async function trade(side: "BUY" | "SELL") {
    setMsg(null);
    const q = Number(qty);
    if (!(q > 0)) return setMsg({ err: "Enter a valid quantity > 0" });
    if (!accountId) return setMsg({ err: "Select an investment account" });

    try {
      setSubmitting(side);
      const res = await fetch("/api/invest/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ accountId, symbol: active, side, quantity: q }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Order failed");

      setMsg({
        ok: `${side} ${q} ${active} @ £${(
          (j.execPricePence ?? Math.round(last * 100)) / 100
        ).toFixed(2)}`,
      });
      router.refresh(); // refresh server state (cash/holdings)
      setTimeout(() => setMsg(null), 2200);
    } catch (e: any) {
      setMsg({ err: e?.message || "Trade failed" });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section className="card">
      {/* symbol chips + account select */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {list.map((s) => {
            const sym = s as Sym;
            const is = sym === active;
            return (
              <button
                key={sym}
                onClick={() => setActive(sym)}
                className={
                  "px-3 py-1 rounded-full text-sm border transition " +
                  (is
                    ? "bg-barclays-navy text-white border-barclays-navy"
                    : "bg-white text-barclays-navy border-gray-200 hover:bg-gray-50")
                }
              >
                {sym}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm min-w-[260px]"
            disabled={!investAccounts.length}
          >
            {!investAccounts.length && (
              <option value="">No investment accounts</option>
            )}
            {investAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.number ? ` • ${a.number.slice(-4)}` : ""} • Cash £
                {(a.balance / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* price + chart + trade controls */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500">{active}</div>
          <div className="mt-1 text-2xl font-semibold">
            {fmtGBP(last)} <span className="text-sm text-gray-500">/share</span>
          </div>
          <div className="mt-1 text-sm" style={{ color }}>
            {ch >= 0 ? "▲" : "▼"} {Math.abs(ch).toFixed(2)} (
            {Math.abs(pct).toFixed(2)}%) today
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-600">Buy</div>
              <div className="font-semibold">{fmtGBP(buyPx)}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-600">Sell</div>
              <div className="font-semibold">{fmtGBP(sellPx)}</div>
            </div>
            <label className="block">
              <div className="text-xs text-gray-600 mb-1">Quantity</div>
              <input
                inputMode="numeric"
                pattern="\\d*"
                value={qty}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setQty(v === "" ? "1" : v);
                }}
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => trade("BUY")}
              disabled={disabled || submitting === "BUY"}
              className={`btn-primary ${
                submitting === "BUY" ? "opacity-60" : ""
              }`}
            >
              {submitting === "BUY" ? "Placing…" : "Buy"}
            </button>
            <button
              onClick={() => trade("SELL")}
              disabled={disabled || submitting === "SELL"}
              className={`btn-secondary ${
                submitting === "SELL" ? "opacity-60" : ""
              }`}
            >
              {submitting === "SELL" ? "Placing…" : "Sell"}
            </button>
          </div>

          {msg?.err && (
            <div className="mt-2 text-sm text-red-600">{msg.err}</div>
          )}
          {msg?.ok && (
            <div className="mt-2 text-sm text-green-700">{msg.ok}</div>
          )}
        </div>

        <div className="md:pr-2 w-full">
          <svg
            viewBox="0 0 340 120"
            className="w-full max-w-[340px] h-[120px]"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="340" height="120" fill="white" rx="10" />
            <path
              d={linePath(current, 340, 120)}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            <path
              d={linePath(current, 340, 120) + " L 332 112 L 8 112 Z"}
              fill={`url(#${gradId})`}
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

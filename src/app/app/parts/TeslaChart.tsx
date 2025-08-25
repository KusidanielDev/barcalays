// FILE: src/app/app/parts/TeslaChart.tsx
"use client";

import * as React from "react";

// Same base logic as server/helpers
const BASE = 239.55;
function priceAt(t: number) {
  const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
  const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
  return Math.max(0.5, BASE + wave + micro);
}

export default function TeslaChart() {
  const [series, setSeries] = React.useState<number[]>([]);
  const [nowPx, setNowPx] = React.useState<number>(priceAt(Date.now()));

  // Build a short intraday series
  React.useEffect(() => {
    const t = Date.now();
    const pts: number[] = [];
    for (let i = 30; i >= 0; i--) {
      const tt = t - i * 60_000; // 1-min steps
      pts.push(priceAt(tt));
    }
    setSeries(pts);
    setNowPx(priceAt(t));

    const id = setInterval(() => {
      const tt = Date.now();
      setNowPx(priceAt(tt));
      setSeries((prev) => {
        const next = prev.slice(1);
        next.push(priceAt(tt));
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const last = series[series.length - 1] ?? nowPx;
  const prev = series[series.length - 2] ?? last;
  const ch = last - prev;
  const pct = prev ? (ch / prev) * 100 : 0;

  // Simple spread to display Buy/Sell
  const spread = last * 0.001; // 10 bps
  const buy = last + spread; // user buys at ask
  const sell = last - spread; // user sells at bid

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

  const color = ch >= 0 ? "#15803d" /* green-700 */ : "#dc2626"; /* red-600 */

  return (
    <section className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500">TSLA</div>
          <div className="mt-1 text-2xl font-semibold">
            £{last.toFixed(2)}{" "}
            <span className="text-sm text-gray-500">/share</span>
          </div>
          <div className="mt-1 text-sm" style={{ color }}>
            {ch >= 0 ? "▲" : "▼"} {Math.abs(ch).toFixed(2)} (
            {Math.abs(pct).toFixed(2)}%) today
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-600">Buy</div>
              <div className="font-semibold">£{buy.toFixed(2)}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-600">Sell</div>
              <div className="font-semibold">£{sell.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="md:pr-2">
          <svg viewBox="0 0 300 96" className="w-[300px] h-[96px]" aria-hidden>
            <defs>
              <linearGradient id="tslagrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="300" height="96" fill="white" rx="10" />
            <path
              d={sparkPath(series, 300, 96)}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            <path
              d={sparkPath(series, 300, 96) + " L 294 90 L 6 90 Z"}
              fill="url(#tslagrad)"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

// FILE: src/app/app/parts/StocksTicker.tsx
"use client";

import * as React from "react";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  currency: string;
};

export default function StocksTicker({ symbols }: { symbols: string[] }) {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    try {
      const q = encodeURIComponent(symbols.join(","));
      const res = await fetch(`/api/quotes?symbols=${q}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as Quote[];
      setQuotes(data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [symbols.join(",")]);

  if (loading && quotes.length === 0) {
    return (
      <div
        className="text-sm text-gray-500"
        aria-busy="true"
        aria-live="polite"
      >
        Loading prices…
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {quotes.map((q) => {
        const up = q.change >= 0;
        return (
          <div key={q.symbol} className="flex items-center gap-1">
            <span className="font-semibold">{q.symbol}</span>
            <span suppressHydrationWarning>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: q.currency,
                maximumFractionDigits: 2,
              }).format(q.price)}
            </span>
            <span className={up ? "text-green-600" : "text-red-600"}>
              {up ? "▲" : "▼"} {Math.abs(q.change).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

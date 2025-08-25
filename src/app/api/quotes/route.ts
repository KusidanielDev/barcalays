// FILE: src/app/api/quotes/route.ts
import { NextResponse } from "next/server";

/**
 * Deterministic pseudo-price generator:
 * - Stable base per symbol
 * - Tiny tick movement on each call (by time bucket)
 */
function baseFor(sym: string) {
  // a stable base per symbol
  const map: Record<string, number> = {
    AAPL: 189.12,
    TSLA: 239.55,
    VUSA: 77.32,
    LGEN: 2.45,
    HSBA: 6.9,
    MSFT: 430.25,
    AMZN: 171.16,
    NVDA: 122.55,
    GOOGL: 168.38,
  };
  return map[sym] ?? 100;
}

function priceFor(sym: string, t: number) {
  const base = baseFor(sym);
  // Little waving + minute jitter; deterministic in short windows
  const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
  const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
  return Math.max(0.5, base + wave + micro);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbols = (searchParams.get("symbols") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const t = Date.now();
  const out = symbols.map((sym) => {
    const p = priceFor(sym, t);
    const pPrev = priceFor(sym, t - 15_000);
    const change = pPrev === 0 ? 0 : ((p - pPrev) / pPrev) * 100;
    // Pick likely currency (USD for US tickers, GBP otherwise)
    const currency = /[A-Z]{4,}/.test(sym) ? "USD" : "GBP"; // simple heuristic
    return {
      symbol: sym,
      price: p,
      change,
      currency: currency === "USD" ? "USD" : "USD",
    };
  });

  return NextResponse.json(out);
}

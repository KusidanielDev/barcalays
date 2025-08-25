// FILE: src/app/api/invest/quotes/route.ts
import { NextResponse } from "next/server";

/**
 * POST /api/invest/quotes
 * Body: { symbols: string[] }
 * Returns: { quotes: { [symbol]: { price: number, change: number } } }
 * (price is in display currency units, NOT pence; this is for UI only.)
 */
export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();
    if (!Array.isArray(symbols) || !symbols.length) {
      return NextResponse.json({ quotes: {} });
    }

    const now = new Date();
    const out: Record<string, { price: number; change: number }> = {};
    for (const sRaw of symbols) {
      const s = String(sRaw).toUpperCase().trim();
      const seed = s.split("").reduce((t, c) => t + c.charCodeAt(0), 0);
      const base =
        s === "TSLA" ? 180 : s === "AAPL" ? 140 : s === "VUSA" ? 75 : 100;
      const drift = Math.sin((now.getUTCSeconds() + seed) / 60) * 1.5; // ±1.5-ish
      const price = Math.max(1, base + drift);
      const change = (Math.cos((now.getUTCSeconds() + seed) / 60) * 1.2) / 100; // ±1.2%
      out[s] = {
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(4)),
      };
    }

    return NextResponse.json({ quotes: out });
  } catch {
    return NextResponse.json({ quotes: {} });
  }
}

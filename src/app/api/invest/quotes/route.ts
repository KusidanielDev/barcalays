import { NextResponse } from "next/server";

// Shared price map and helpers (keep in sync with place-order)
const BASE: Record<string, number> = {
  AAPL: 189.12,
  TSLA: 239.55,
  VUSA: 77.32,
  LGEN: 2.45,
  HSBA: 6.9,
  MSFT: 430.25,
  AMZN: 171.16,
  NVDA: 122.55,
  GOOGL: 168.38,
  META: 517.57,
  BP: 4.85,
  SHEL: 28.72,
  BARC: 1.45,
  RIO: 56.12,
  VOD: 0.72,
  INF: 8.5,
  ENM: 9.1,
};

function priceFor(sym: string, t: number) {
  const base = BASE[sym] ?? 100;
  const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
  const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
  return Math.max(0.5, base + wave + micro);
}

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json();
    const list: string[] = Array.isArray(symbols) ? symbols : [];
    const t = Date.now();
    const quotes = list.map((s) => {
      const sym = String(s || "").toUpperCase();
      const px = priceFor(sym, t);
      const pxPrev = priceFor(sym, t - 60_000);
      const change = px - pxPrev;
      const pct = pxPrev ? (change / pxPrev) * 100 : 0;
      return {
        symbol: sym,
        priceP: Math.round(px * 100), // pence
        changeP: Math.round(change * 100), // pence
        changePct: pct,
        asOf: new Date(t).toISOString(),
      };
    });
    return NextResponse.json({ quotes });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Bad request" },
      { status: 400 }
    );
  }
}

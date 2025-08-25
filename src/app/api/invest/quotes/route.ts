// FILE: src/app/api/invest/quotes/route.ts
import { NextResponse } from "next/server";

function basePrice(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++)
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  return 5000 + (hash % 40000); // pence 50–450
}

export async function POST(req: Request) {
  const { symbols = [] } = await req.json().catch(() => ({ symbols: [] }));
  const now = Date.now();
  const quotes = symbols.map((s: string, i: number) => {
    const b = basePrice(s.toUpperCase());
    const wobble = Math.sin(now / 40000 + i) * (b * 0.02); // ±2%
    const priceP = Math.max(50, Math.round(b + wobble));
    const changeP = Math.round(priceP - b);
    const changePct = +((changeP / b) * 100).toFixed(2);
    return {
      symbol: s.toUpperCase(),
      priceP,
      changeP,
      changePct,
      asOf: new Date().toISOString(),
    };
  });
  return NextResponse.json({ quotes });
}

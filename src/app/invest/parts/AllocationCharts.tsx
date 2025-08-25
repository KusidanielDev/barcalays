// FILE: src/app/invest/parts/AllocationCharts.tsx
"use client";
import * as React from "react";

type Holding = {
  accountId: string;
  quantity: any; // Prisma.Decimal or number-like
  avgCostP: number;
  security: { symbol: string };
  account: { id: string; name: string };
};

export default function AllocationCharts({
  holdings,
}: {
  holdings: Holding[];
}) {
  // Compute "value" using avg cost (keeps Analyse tab simple and serverless)
  const values = holdings.map((h) => ({
    sym: h.security.symbol,
    acc: h.account.name,
    v: Number(h.quantity) * h.avgCostP, // pence
  }));

  // ----- Grouped sums (typed) -----
  const valueBySym: Record<string, number> = values.reduce((m, r) => {
    m[r.sym] = (m[r.sym] ?? 0) + r.v;
    return m;
  }, {} as Record<string, number>);
  const labels = Object.keys(valueBySym);
  const bySym = labels.map((sym) => valueBySym[sym]); // number[]
  const total: number = bySym.reduce((a, b) => a + b, 0) || 1;

  const valueByAcc: Record<string, number> = values.reduce((m, r) => {
    m[r.acc] = (m[r.acc] ?? 0) + r.v;
    return m;
  }, {} as Record<string, number>);
  const series = Object.keys(valueByAcc).map((name) => ({
    name,
    total: valueByAcc[name],
  }));

  // ----- Pie (SVG) -----
  let angle = 0;
  const arcs = labels.map((sym, i) => {
    const v = valueBySym[sym];
    const frac = v / total;
    const a0 = angle;
    angle += frac * Math.PI * 2;
    const a1 = angle;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const r = 60,
      cx = 70,
      cy = 70;
    const x0 = cx + r * Math.cos(a0),
      y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1),
      y1 = cy + r * Math.sin(a1);
    return {
      d: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`,
      label: sym,
      frac,
    };
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <div className="font-medium">Allocation by holding</div>
        <svg viewBox="0 0 140 140" className="mt-2 w-60 h-60">
          {arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill={`hsl(${(i * 70) % 360} 70% 55%)`} />
          ))}
        </svg>
        <div className="mt-2 text-sm text-gray-700">
          {labels.map((l, i) => (
            <div key={l} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ background: `hsl(${(i * 70) % 360} 70% 55%)` }}
              />
              {l}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="font-medium">Value by account</div>
        <div className="mt-4 space-y-3">
          {series.map((s, i) => {
            const w = total ? (s.total / total) * 100 : 0;
            return (
              <div key={s.name}>
                <div className="text-sm">
                  {s.name} - £{(s.total / 100).toFixed(2)}
                </div>
                <div className="h-3 bg-gray-200 rounded">
                  <div
                    className="h-3 rounded"
                    style={{
                      width: `${w}%`,
                      background: `hsl(${(i * 90) % 360} 65% 45%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

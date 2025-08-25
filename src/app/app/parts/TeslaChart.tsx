// FILE: src/app/app/parts/TeslaChart.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };

export default function TeslaChart() {
  // 120 points of random walk around 250
  const [data, setData] = useState<Pt[]>(
    Array.from({ length: 120 }, (_, i) => ({
      x: i,
      y: 250 + (Math.random() - 0.5) * 3,
    }))
  );
  const [last, setLast] = useState<number>(data[data.length - 1].y);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setData((prev) => {
        const lastY = prev[prev.length - 1].y;
        const nextY = Math.max(180, lastY + (Math.random() - 0.5) * 2.2);
        setLast(nextY);
        const next = [
          ...prev.slice(1),
          { x: prev[prev.length - 1].x + 1, y: nextY },
        ];
        return next;
      });
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  // scale to SVG 300x120
  const [minY, maxY] = useMemo(() => {
    let mn = Infinity,
      mx = -Infinity;
    for (const p of data) {
      if (p.y < mn) mn = p.y;
      if (p.y > mx) mx = p.y;
    }
    // pad a bit
    const pad = (mx - mn) * 0.1 || 1;
    return [mn - pad, mx + pad];
  }, [data]);

  const path = useMemo(() => {
    const w = 300,
      h = 120;
    const scaleX = (x: number) =>
      ((x - data[0].x) / (data[data.length - 1].x - data[0].x)) * (w - 10) + 5;
    const scaleY = (y: number) =>
      h - ((y - minY) / (maxY - minY)) * (h - 10) - 5;
    return data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
      .join(" ");
  }, [data, minY, maxY]);

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    []
  );

  const diff = last - data[data.length - 2].y;
  const dir = diff >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="font-semibold">TSLA (simulated)</div>
        <div className="text-sm">
          <span className="font-medium">{fmt.format(last)}</span>{" "}
          <span className={dir}>
            {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(2)}
          </span>
        </div>
      </div>
      <svg viewBox="0 0 300 120" className="mt-2 w-full h-[140px]">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <div className="text-xs text-gray-500">
        Live price movement (random walk)
      </div>
    </div>
  );
}

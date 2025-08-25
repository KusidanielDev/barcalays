// FILE: src/app/app/parts/TradeModal.tsx
"use client";
import * as React from "react";

export default function TradeModal({
  accountId,
  symbol,
  side,
  onClose,
}: {
  accountId: string;
  symbol: string;
  side: "BUY" | "SELL";
  onClose: (done?: boolean) => void;
}) {
  const [qty, setQty] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [quote, setQuote] = React.useState<{ priceP: number } | null>(null);

  React.useEffect(() => {
    fetch("/api/invest/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: [symbol] }),
    })
      .then((r) => r.json())
      .then((j) => setQuote(j.quotes[0] || null));
  }, [symbol]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/invest/order`; // if you already added this route earlier
    const res = await fetch(url || "/api/invest/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, symbol, side, quantity: Number(qty) }),
    }).catch(() => null);
    setSubmitting(false);
    if (!res || !res.ok) {
      setError("Order failed");
      return;
    }
    onClose(true);
  }

  const px = quote ? quote.priceP / 100 : 0;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center">
      <div className="bg-white rounded-lg shadow-lg w-[92vw] max-w-md p-5">
        <h3 className="text-lg font-semibold">Place order</h3>
        <p className="text-sm text-gray-600 mt-1">
          {side} {symbol}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value || 1))}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div className="text-sm text-gray-700">
            Price: {quote ? `£${px.toFixed(2)}` : "—"}
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "Submitting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

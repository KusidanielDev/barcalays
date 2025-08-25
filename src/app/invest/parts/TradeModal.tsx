// FILE: src/app/invest/parts/TradeModal.tsx
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
  const [quote, setQuote] = React.useState<{
    priceP: number;
    changePct: number;
  } | null>(null);

  React.useEffect(() => {
    fetch("/api/invest/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: [symbol] }),
    })
      .then((r) => r.json())
      .then((j) => setQuote(j.quotes[0]));
  }, [symbol]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/invest/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, symbol, side, quantity: Number(qty) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Order failed");
      return;
    }
    onClose(true);
  }

  const price = quote ? quote.priceP / 100 : 0;
  const est = price * qty + 6; // fee £6 like demo

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
            Price: {quote ? `£${price.toFixed(2)}` : "—"} &nbsp; | &nbsp; Est.
            total (incl. £6 fee): <b>£{est.toFixed(2)}</b>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
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

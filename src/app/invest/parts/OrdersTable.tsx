// FILE: src/app/invest/parts/OrdersTable.tsx
"use client";
export default function OrdersTable({ orders }: { orders: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 border-b">
            <th className="py-2 pr-3">Time</th>
            <th className="py-2 pr-3">Acct</th>
            <th className="py-2 pr-3">Symbol</th>
            <th className="py-2 pr-3">Side</th>
            <th className="py-2 pr-3">Qty</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Est. (p)</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="py-2 pr-3">
                {new Date(o.placedAt).toLocaleString()}
              </td>
              <td className="py-2 pr-3">{o.account.name}</td>
              <td className="py-2 pr-3">{o.security.symbol}</td>
              <td className="py-2 pr-3">{o.side}</td>
              <td className="py-2 pr-3">{Number(o.quantity)}</td>
              <td className="py-2 pr-3">{o.status}</td>
              <td className="py-2 pr-3">{o.estCostPence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

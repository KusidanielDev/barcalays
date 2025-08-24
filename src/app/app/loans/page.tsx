// FILE: src/app/app/loans/page.tsx
export default function LoansPage() {
  const cards = [
    {
      title: "Personal loan",
      apr: "Representative 8.9% APR",
      copy: "Borrow for planned purchases with fixed monthly repayments.",
    },
    {
      title: "Car loan",
      apr: "Representative 7.5% APR",
      copy: "Spread the cost of a new or used car with predictable payments.",
    },
    {
      title: "Debt consolidation",
      apr: "Representative 10.9% APR",
      copy: "Combine existing debts into a single monthly repayment.",
    },
  ];
  return (
    <div className="grid gap-6">
      <div className="card">
        <h1 className="text-xl font-bold text-barclays-navy">Loans</h1>
        <p className="text-gray-700 mt-1">
          Subject to application and status. Terms and conditions apply.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="border rounded-2xl p-4">
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm text-gray-600">{c.apr}</div>
              <p className="text-sm text-gray-700 mt-2">{c.copy}</p>
              <button className="btn-secondary mt-3">Check eligibility</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

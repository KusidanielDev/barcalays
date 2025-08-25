export default function IncomeSummary({
  returnsP,
  dividendsP,
  startDateLabel,
}: {
  returnsP: number; // pence
  dividendsP: number; // pence
  startDateLabel?: string;
}) {
  const fmt = (pence: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(pence / 100);

  return (
    <section className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-barclays-navy">
            Recurring income
          </div>
          {startDateLabel ? (
            <div className="text-xs text-gray-500 mt-1">
              as of {startDateLabel}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-600">Monthly returns</div>
            <div className="text-lg font-semibold text-green-700">
              {fmt(returnsP)}
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-600">Monthly dividends</div>
            <div className="text-lg font-semibold text-green-700">
              {fmt(dividendsP)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

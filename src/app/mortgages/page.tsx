import Link from "next/link";
export default function MortgagesPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold text-barclays-navy">Mortgages</h1>
      <p className="mt-2 text-gray-700">
        From first homes to remortgaging — we are here to help.
      </p>
      <div className="card mt-4">
        <div className="font-semibold">Fixed-rate mortgages</div>
        <div className="text-sm text-gray-600">
          Predictable payments over your fixed term.
        </div>
      </div>
      <div className="card mt-3">
        <div className="font-semibold">Tracker mortgages</div>
        <div className="text-sm text-gray-600">
          Rates that track the Bank of England base rate.
        </div>
      </div>
      <Link href="/signup" className="btn-primary mt-6 inline-block">
        Start your application
      </Link>
    </div>
  );
}

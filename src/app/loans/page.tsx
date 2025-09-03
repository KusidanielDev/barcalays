import Link from "next/link";
export default function LoansPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold text-barclays-navy">Loans</h1>
      <p className="mt-2 text-gray-700">
        Borrow responsibly with clear rates and terms.
      </p>
      <ul className="mt-4 list-disc list-inside">
        <li>Personal loans from £1,000 to £25,000</li>
        <li>Flexible terms from 12 to 60 months</li>
        <li>No early repayment fees ( )</li>
      </ul>
      <Link href="/signup" className="btn-primary mt-6 inline-block">
        Check eligibility
      </Link>
    </div>
  );
}

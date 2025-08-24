import Image from "next/image";
import Link from "next/link";

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-green-600 mt-1">✔</span>
      <span>{children}</span>
    </li>
  );
}

export default function AccountsPage() {
  return (
    <div>
      <section className="bg-gray-50 border-b">
        <div className="container py-10 flex items-center gap-8">
          <div className="relative hidden md:block w-[520px] h-[280px] rounded-xl bg-gray-200">
            <Image
              src="/images/app-promo.jpg"
              alt="Barclays app promo"
              fill
              className="object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-barclays-navy">
              Current accounts
            </h1>
            <p className="mt-2 text-gray-700 max-w-prose">
              Everyday banking with a contactless debit card, mobile app access
              and optional overdraft.
            </p>
            <Link href="/signup" className="btn-primary mt-4 inline-block">
              Apply now
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-12 grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold">Barclays Bank Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <Feature>No monthly fee</Feature>
            <Feature>Contactless debit card</Feature>
            <Feature>Mobile banking app access</Feature>
            <Feature>Optional overdraft (subject to status)</Feature>
          </ul>
          <Link href="/signup" className="btn-primary mt-6">
            Apply now
          </Link>
        </div>
        <div className="card">
          <h3 className="text-xl font-semibold">Premier Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <Feature>Dedicated support</Feature>
            <Feature>Preferential rates</Feature>
            <Feature>Exclusive offers</Feature>
            <Feature>Eligibility applies (18+, UK resident)</Feature>
          </ul>
          <Link href="/signup" className="btn-primary mt-6">
            Apply now
          </Link>
        </div>
      </section>
    </div>
  );
}

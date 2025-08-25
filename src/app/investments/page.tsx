export default function InvestmentsOverview() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-barclays-navy">
          Investments
        </h1>
        <p className="mt-2 text-gray-700">
          Choose an account and start building your portfolio. Capital is at
          risk; investments can go down as well as up.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-700">
          <li>
            <a className="underline" href="/investments/isa">
              Stocks &amp; Shares ISA
            </a>
          </li>
          <li>
            <a className="underline" href="/investments/gia">
              General Investment Account (GIA)
            </a>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What can I invest in?</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-700">
          <li>
            <a className="underline" href="/investments/funds">
              Funds &amp; ETFs
            </a>
          </li>
          <li>
            <a className="underline" href="/investments/bonds">
              Bonds &amp; Gilts
            </a>
          </li>
          <li>
            <a className="underline" href="/investments/risk-fees">
              Risk &amp; Fees
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}

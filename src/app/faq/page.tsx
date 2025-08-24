export default function FAQPage() {
  const faqs = [
    { q: "Is this a real bank?", a: "No. This is an educational demo." },
    {
      q: "Do payments move real money?",
      a: "No. All balances are simulated in a local DB.",
    },
    {
      q: "Can I deploy this?",
      a: "Yes, but you must remove any Barclays references and branding.",
    },
  ];
  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-barclays-navy">
        Frequently Asked Questions
      </h1>
      <div className="mt-6 space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="card">
            <div className="font-semibold">{f.q}</div>
            <div className="text-sm text-gray-600 mt-1">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

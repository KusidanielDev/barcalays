// FILE: src/components/ExploreCards.tsx
function Card({
  icon,
  title,
  desc,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <div className="card h-full">
      <div className="mb-3 text-barclays-navy">{icon}</div>
      <div className="text-lg font-semibold text-barclays-navy">{title}</div>
      <p className="mt-1 text-sm text-gray-700">{desc}</p>
      <a href="#" className="btn-secondary mt-4 inline-block">
        {cta}
      </a>
    </div>
  );
}

const I = {
  pound: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M7 17h10M12 17v-6a4 4 0 1 0-4 0v6" />
    </svg>
  ),
  card: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  pig: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 11a7 7 0 0 1 13 0v3h2v3h-3a7 7 0 0 1-12 0H3v-3h2v-3Z" />
      <circle cx="9" cy="10" r="1" />
    </svg>
  ),
  key: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="7" cy="12" r="3" />
      <path d="M10 12h10l-2 2 2 2" />
    </svg>
  ),
  canopy: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 10h18l-2 8H5l-2-8Z" />
      <path d="M6 10V6h12v4" />
    </svg>
  ),
  cart: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
      <path d="M3 5h2l2 10h10l2-6H6" />
    </svg>
  ),
  plus: (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

export default function ExploreCards() {
  return (
    <section className="container py-12 md:py-16">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-barclays-navy">
          Explore all Barclays has to offer
        </h2>
        <p className="mt-2 text-gray-700">
          See how we can help you with current accounts, mortgages, insurance,
          loans, credit cards and savings accounts.
        </p>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card
          icon={I.pound}
          title="Current accounts"
          desc="Find a current account that works for you."
          cta="View current accounts"
        />
        <Card
          icon={I.card}
          title="Credit cards"
          desc="Choice is the key to finding the right credit card."
          cta="View credit cards"
        />
        <Card
          icon={I.pig}
          title="Savings accounts"
          desc="Whatever you’re dreaming of, you can start saving today."
          cta="View savings accounts"
        />
        <Card
          icon={I.pound}
          title="Loans"
          desc="Focus on the future with a personal loan."
          cta="View loans"
        />
        <Card
          icon={I.key}
          title="Mortgages"
          desc="Take a look at the range of mortgages we can offer to help with your plans."
          cta="View mortgages"
        />
        <Card
          icon={I.canopy}
          title="Insurance"
          desc="Your safety net if things go wrong. Explore life, tech, business and travel cover."
          cta="View insurance"
        />
        <Card
          icon={I.cart}
          title="Investments"
          desc="Whether you’re a beginner, an expert or in between – make the most of your money."
          cta="View investments"
        />
        <Card
          icon={I.plus}
          title="Offers & subscriptions"
          desc="Start enjoying your favourite offers and subscriptions through the Barclays app."
          cta="Offers & subscriptions"
        />
      </div>
    </section>
  );
}

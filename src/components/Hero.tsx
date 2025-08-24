// FILE: src/components/Hero.tsx
import Image from "next/image";

export default function Hero() {
  return (
    <section className="container py-8 md:py-12">
      <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-xs tracking-widest text-barclays-navy font-semibold">
            PERSONAL BANKING
          </div>
          <h2 className="mt-2 text-3xl md:text-5xl font-extrabold text-barclays-navy">
            Get £175 when you switch to us
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-700">
            Open an eligible current account and switch to us in the Barclays
            app by 28 August 2025 to get your £175. UK residents and 18+ only.
            T&Cs and eligibility apply.
          </p>
          <a href="/signup" className="btn-primary mt-4 inline-block">
            More about switching
          </a>
        </div>
        <div className="relative aspect-[4/3] md:aspect-[16/10] w-full">
          <Image
            src="/images/hero-image.jpg"
            alt="Hero"
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover rounded-xl"
          />
        </div>
      </div>
      <div className="mt-3 text-xs md:text-sm text-gray-600">
        <strong>T&Cs and eligibility apply.</strong> You must (1) open a sole
        Barclays Bank Account or sole Premier Current Account, (2) initiate a
        full switch between 15 Jul and 28 Aug 25 and complete within 30 days,
        (3) for Barclays Bank Account only, you must join Blue Rewards
        (eligibility & £5/month fee apply) via the app, (4) deposit £1,500 into
        the nominated eligible account within 30 days of opening. For Premier
        Current Account, other T&Cs and eligibility apply. For new customers
        only, 18+ and UK only.
      </div>
    </section>
  );
}

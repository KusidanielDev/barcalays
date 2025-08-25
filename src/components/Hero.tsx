// FILE: src/components/Hero.tsx
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-[#00AEEF]">
      {/* Put the content inside a max-width to let the blue show around */}
      <div className="container py-6 md:py-10">
        {/* Smaller columns; no gap so they touch; no rounded corners anywhere */}
        <div className="mx-auto max-w-6xl grid gap-0 md:grid-cols-2 items-stretch">
          {/* Text panel */}
          <div className="bg-[#26288d] text-white px-6 md:px-10 py-6 md:py-10 flex flex-col justify-center min-h-[200px] md:min-h-[360px]">
            <div className="text-xs tracking-widest font-semibold opacity-90">
              PERSONAL BANKING
            </div>
            <h2 className="mt-2 text-2xl md:text-4xl font-extrabold leading-tight">
              Get £175 when you switch to us
            </h2>
            <p className="mt-3 text-sm md:text-base text-sky-100/90 max-w-prose">
              Open an eligible current account and switch to us in the Barclays
              app by 28 August 2025. UK residents 18+. T&amp;Cs and eligibility
              apply.
            </p>

            {/* Only this button */}
            <div className="mt-5">
              <Link
                href="/switching"
                className="inline-flex items-center rounded-full border border-white/90 bg-white px-5 py-2 text-[#26288d] hover:bg-white/90"
              >
                More about switching
              </Link>
            </div>
          </div>

          {/* Image panel (no border radius) */}
          <div className="relative min-h-[200px] md:min-h-[360px]">
            <Image
              src="/images/hero-image.jpg"
              alt="Barclays app"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

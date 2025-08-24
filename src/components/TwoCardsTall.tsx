// FILE: src/components/TwoCardsTall.tsx
import Image from "next/image";

export function TwoCardsTall() {
  return (
    <section className="container py-12 md:py-16">
      <h3 className="text-2xl md:3xl font-bold text-barclays-navy text-center">
        Independent service quality survey results
      </h3>
      <p className="mt-2 text-gray-700 text-center">
        Personal current accounts\nAn independent survey asked customers if they
        would recommend their personal current account provider to friends and
        family.
      </p>
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border rounded-2xl shadow-sm p-6 h-[60vh] flex flex-col"
          >
            <div className="relative w-full h-64 md:h-72 bg-white rounded-xl border flex items-center justify-center p-2">
              <Image
                src={`/images/section-5-img-${i}.jpg`}
                alt=""
                fill
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-contain p-2"
              />
            </div>
            <div className="mt-4 font-semibold text-barclays-navy">
              {i === 1 ? "Great Britain" : "Northern Ireland"}
            </div>
            <a href="#" className="btn-secondary mt-auto self-start">
              View full results
            </a>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-600">
        The Financial Conduct Authority also requires us to publish information
        about service. The requirement to publish the Financial Conduct
        Authority Service Quality Information for personal current accounts can
        be found here.
      </p>
    </section>
  );
}

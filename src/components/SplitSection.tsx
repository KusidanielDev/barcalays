// FILE: src/components/SplitSection.tsx
import Image from "next/image";

export function SplitSection({
  image,
  title,
  lead,
  body,
  cta,
}: {
  image: string;
  title: string;
  lead?: string;
  body?: string;
  cta: string;
}) {
  return (
    <section className="container py-10 md:py-16">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-[4/3] md:aspect-[16/10] w-full">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover rounded-xl"
          />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-barclays-navy whitespace-pre-line">
            {title}
          </h3>
          {lead && <p className="mt-2 font-semibold text-gray-900">{lead}</p>}
          {body && (
            <p className="mt-2 text-gray-700 whitespace-pre-line">{body}</p>
          )}
          <a href="#" className="btn-primary mt-4 inline-block">
            {cta}
          </a>
        </div>
      </div>
    </section>
  );
}

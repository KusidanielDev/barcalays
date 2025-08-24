// FILE: src/components/APPScams.tsx
import React from "react";
import Image from "next/image";

type ColProps = { title: string; text: string; img: string };

function Col({ title, text, img }: ColProps) {
  return (
    <div className="card">
      <h4 className="text-lg md:text-xl font-bold text-barclays-navy">
        {title}
      </h4>
      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{text}</p>
      <div className="relative w-full h-56 md:h-64 mt-4 bg-white rounded-xl border flex items-center justify-center p-2">
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-contain p-2"
        />
      </div>
      <a href="#" className="mt-4 inline-block text-barclays-blue underline">
        Read full report &gt;
      </a>
    </div>
  );
}

export function APPScams() {
  const intro = `Authorised push payment (APP) fraud happens when someone is tricked into transferring money to a fraudster’s bank account.

These charts use data given to the Payment Systems Regulator (PSR) by major banking groups in the UK in 2023.

You can read the full report by visiting www.psr.org.uks/app-fraud-data.`;

  const s6b = `This is the amount of money sent from the victim’s account to the scammer, ranked out of 14 firms.

For example, for every £1 million of Barclays transactions sent in 2023, £135 was lost to APP scams.`;

  const s7a = `This is the amount of money received into the scammer’s account from the victim, ranked out of all UK banks and payment firms.

For example, for every £1 million received into consumer’s accounts at Skrill, £18,550 of it was APP scams.`;

  const s7b = `This is the amount of money received into the scammer’s account from the victim, ranked out of all UK banks and payment firms.

For example, for every £1 million received into consumer’s accounts at Barclays, £67 of it was APP scams.`;

  return (
    <section className="container py-12 md:py-16">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-barclays-navy">
            Authorised push payment (APP) scams rankings in 2023
          </h3>
          <p className="mt-2 text-gray-700 whitespace-pre-line">{intro}</p>
        </div>

        {/* Section 6 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Col
            title="Share of APP scams refunded"
            text="This is the proportion of total APP fraud losses that were reimbursed, ranked out of 14 firms."
            img="/images/section-6-img-1.jpg"
          />
          <Col
            title="APP scams sent per £million transactions"
            text={s6b}
            img="/images/section-6-img-2.jpg"
          />
        </div>

        {/* Section 7 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Col
            title="APP scams received per £million transactions: smaller UK banks and payment firms"
            text={s7a}
            img="/images/section-7-img-1.jpg"
          />
          <Col
            title="APP scams received per £million transactions: major UK banks and building societies"
            text={s7b}
            img="/images/section-7-img-2.jpg"
          />
        </div>

        <a href="#" className="text-barclays-blue underline">
          Find out more about how we protect you
        </a>

        <div className="text-xs text-gray-600">
          <strong>Important information</strong>
          <br />
          You must be 16 or over and have a Barclays current account, mortgage
          account or a Barclaycard to use the Barclays app. If you are 11 to 15,
          you can use another version of the app. Terms and conditions apply.
          (Return to reference)
        </div>
      </div>
    </section>
  );
}

export default APPScams;

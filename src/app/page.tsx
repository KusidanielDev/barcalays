// FILE: src/app/page.tsx
import BankHeader from "@/components/BankHeader";
import Hero from "@/components/Hero";
import ExploreCards from "@/components/ExploreCards";
import { SplitSection } from "@/components/SplitSection";
import { TwoCardsTall } from "@/components/TwoCardsTall";
import APPScams from "@/components/APPScams";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <>
      <BankHeader />
      <main>
        <Hero />
        <ExploreCards />
        <SplitSection
          image="/images/section-3-image.jpg"
          title={"Get a rewarding cashback* bonus on eligible purchases"}
          body={
            "Get cashback* on all your eligible purchases with a Barclaycard Rewards credit card.\n\nRepresentative 28.9% APR (variable)\nSubject to application and financial status. *Cashback on eligible purchases only. Terms, conditions and exclusions apply."
          }
          cta="Check your eligibility"
        />
        <section className="container py-6">
          <div className="bg-white border rounded-2xl p-6">
            <h4 className="text-xl font-bold text-barclays-navy">
              We’re here to help if you have a residential mortgage with us
            </h4>
            <p className="mt-2 text-gray-700">
              We’re supporting the new Mortgage Charter announced by the
              Government on Friday 23 June 2023.\n\nTake a look at our mortgage
              support hub to see what help we have available.
            </p>
            <a href="#" className="btn-secondary mt-3 inline-block">
              Mortgage support hub
            </a>
          </div>
        </section>
        <SplitSection
          image="/images/section-4-img.jpg"
          title={"Money\nmanagement"}
          body={
            "Learn how to take control of your money with help from our tips, tools and support."
          }
          cta="Manage your money"
        />
        <TwoCardsTall />
        <APPScams />
      </main>
      <SiteFooter />
    </>
  );
}

// FILE: src/app/app/invest/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InvestHeader from "./parts/InvestHeader";
import InvestHubClientPro from "./parts/InvestHubClientPro";
import CreateInvestmentNudge from "./parts/CreateInvestmentNudge";

export const dynamic = "force-dynamic";

export default async function InvestHome() {
  const session = await auth();
  if (!session?.user?.email) return <div className="p-6">Please sign in.</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
  if (!user) return <div className="p-6">No user.</div>;

  const accounts = await prisma.account.findMany({
    where: { userId: user.id, type: "INVESTMENT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, balance: true, currency: true },
  });

  if (accounts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-[#00395d]">
          Investing with Barclays
        </h1>
        <p className="text-gray-700">
          Build wealth with shares, funds and ETFs. Explore research, screeners
          and low-cost portfolios.
        </p>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Invest from as little as £25</li>
          <li>Clear fees, simple dealing</li>
          <li>Realtime prices and portfolio tools</li>
        </ul>
        <CreateInvestmentNudge />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 space-y-4">
      <InvestHeader />
      <InvestHubClientPro accounts={accounts} />
    </div>
  );
}

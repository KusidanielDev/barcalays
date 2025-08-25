// FILE: src/app/app/home/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const fmt = (p: number, c = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(
    p / 100
  );

export const dynamic = "force-dynamic";

export default async function BankingHome() {
  const session = await auth();
  if (!session?.user?.email) return <div className="p-6">Please sign in.</div>;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    });
    if (!user) return <div className="p-6">No user.</div>;

    const [accounts, tx] = await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id, NOT: { type: "INVESTMENT" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.findMany({
        where: { account: { userId: user.id, NOT: { type: "INVESTMENT" } } },
        orderBy: { postedAt: "desc" },
        include: { account: { select: { name: true, currency: true } } },
        take: 12,
      }),
    ]);

    const currency = accounts[0]?.currency ?? "GBP";
    const total = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);

    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#00395d]">
            Banking
          </h1>
          <div className="flex gap-2">
            <Link href="/app/accounts/new" className="btn-primary">
              Open new account
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card title="Total balance" value={fmt(total, currency)} />
          <Card title="Accounts" value={String(accounts.length)} />
          <Card title="Last 12 transactions" value={String(tx.length)} />
          <Card title="Currency" value={currency} />
        </div>

        {/* Feature tiles (classic sections) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Tile
            href="/app/analytics"
            title="Analytics"
            desc="Spending insights, trends and categories."
          />
          <Tile
            href="/app/budgets"
            title="Budgets"
            desc="Create and track monthly budgets."
          />
          <Tile
            href="/app/cards"
            title="Cards"
            desc="Manage your debit/credit cards."
          />
          <Tile
            href="/app/loans"
            title="Loans"
            desc="Explore available loans and eligibility."
          />
          <Tile
            href="/app/standing-orders"
            title="Standing orders"
            desc="Recurring payments at a glance."
          />
          <Tile
            href="/app/goals"
            title="Goals"
            desc="Savings goals and progress."
          />
        </section>

        {/* Recent activity */}
        <div className="rounded-2xl border bg-white">
          <div className="p-4 border-b">
            <div className="text-lg font-semibold text-[#00395d]">
              Recent activity
            </div>
          </div>
          <div className="divide-y">
            {tx.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {t.account?.name ?? "Account"}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(t.postedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-700 mt-1">{t.description}</div>
                <div
                  className={`mt-1 tabular-nums font-semibold ${
                    t.amount >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {t.amount >= 0 ? "+" : "−"}
                  {fmt(Math.abs(t.amount), t.account?.currency ?? "GBP")}
                </div>
              </div>
            ))}
            {tx.length === 0 && (
              <div className="p-4 text-sm text-gray-600">
                No transactions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    // Don’t crash SSR in production. Show a friendly message instead.
    console.error("BankingHome error", err);
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold text-red-600">We hit a snag</h1>
        <p className="mt-2 text-gray-600">
          Your dashboard couldn’t load. Please try again, or contact support if
          this persists.
        </p>
      </div>
    );
  }
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold tabular-nums text-[#00395d]">
        {value}
      </div>
    </div>
  );
}
function Tile({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-white p-4 hover:bg-gray-50"
    >
      <div className="text-[#00395d] font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
    </Link>
  );
}

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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Total balance" value={fmt(total, currency)} />
        <Card title="Accounts" value={String(accounts.length)} />
        <Card title="Last 12 transactions" value={String(tx.length)} />
        <Card title="Currency" value={currency} />
      </div>

      {/* Feature tiles (restore classic sections) */}
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
          href="/app/goals"
          title="Goals"
          desc="Save towards goals and milestones."
        />
        <Tile
          href="/app/loans"
          title="Loans"
          desc="Explore personal loan options."
        />
        <Tile
          href="/app/standing-orders"
          title="Standing orders"
          desc="Recurring payments in one place."
        />
      </section>

      {/* Accounts list */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Your accounts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`/app/accounts/${a.id}`}
              className="rounded-xl border p-4 bg-gray-50 hover:bg-gray-100"
            >
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {a.type}
              </div>
              <div className="font-semibold text-[#00395d]">{a.name}</div>
              <div className="text-sm tabular-nums">
                {fmt(a.balance, a.currency)}
              </div>
            </Link>
          ))}
          {accounts.length === 0 && (
            <div className="text-sm text-gray-600">
              No banking accounts yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent history */}
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Recent history</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tx.map((t) => (
            <div key={t.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.account?.name}</div>
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
            <div className="text-sm text-gray-600">No transactions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
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

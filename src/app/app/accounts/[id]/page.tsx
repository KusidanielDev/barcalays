// FILE: src/app/app/accounts/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

const fmtGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100
  );

export default async function AccountDetail({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.email) notFound();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const account = await prisma.account.findFirst({
    where: { id: params.id, userId: user!.id },
  });
  if (!account) notFound();

  const tx = await prisma.transaction.findMany({
    where: { accountId: account.id },
    orderBy: { postedAt: "desc" },
    take: 10,
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-barclays-navy">
          Account details
        </h1>
        <div className="flex gap-2">
          <Link className="btn-secondary" href="/app/accounts">
            All accounts
          </Link>
          <Link
            className="btn-secondary"
            href={`/app/transactions?account=${account.id}`}
          >
            View all transactions
          </Link>
        </div>
      </div>

      <div className="card grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Name</div>
          <div className="font-semibold">{account.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Type</div>
          <div className="font-semibold">{account.type}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Number</div>
          <div className="font-semibold">{account.number}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Sort code</div>
          <div className="font-semibold">{account.sortCode}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Currency</div>
          <div className="font-semibold">{account.currency}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Balance</div>
          <div className="text-2xl font-semibold">
            {fmtGBP(account.balance)}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="font-semibold text-barclays-navy">
          Recent transactions
        </div>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="py-2">
                  {new Date(t.postedAt).toLocaleDateString("en-GB")}
                </td>
                <td>{t.description}</td>
                <td
                  className={`text-right ${
                    t.amount < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {fmtGBP(t.amount)}
                </td>
                <td className="text-right">
                  {t.balanceAfter != null ? fmtGBP(t.balanceAfter) : "—"}
                </td>
              </tr>
            ))}
            {tx.length === 0 && (
              <tr>
                <td className="py-3 text-gray-600" colSpan={4}>
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// FILE: src/components/AppAccountsStrip.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const fmt = (p: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    (p ?? 0) / 100
  );

export default async function AppAccountsStrip() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return null;

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });

  if (accounts.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-white p-3 md:p-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Your accounts
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {accounts.map((a) => (
          <Link
            key={a.id}
            href={`/app/accounts/${a.id}`}
            className="min-w-[210px] rounded-xl border bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-2"
          >
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {a.type}
            </div>
            <div className="font-semibold text-barclays-navy">{a.name}</div>
            <div className="text-sm tabular-nums">
              {fmt(a.balance, a.currency)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// FILE: src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.email || role !== "ADMIN") redirect("/app");

  const [counts, accounts, users, txs] = await Promise.all([
    getKpis(),
    prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            approved: true,
            status: true,
          },
        },
      },
      take: 60,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.transaction.findMany({
      orderBy: { postedAt: "desc" },
      include: { account: { select: { number: true } } },
      take: 18,
    }),
  ]);

  // Pass plain JSON to the client component
  return (
    <AdminClient
      counts={counts}
      initialAccounts={JSON.parse(JSON.stringify(accounts))}
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialTx={JSON.parse(JSON.stringify(txs))}
    />
  );
}

async function getKpis() {
  const [users, accounts, cards, tx7d] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.card.count(),
    prisma.transaction.count({
      where: {
        postedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  return { users, accounts, cards, tx7d };
}

// FILE: src/app/app/cards/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function CardsPage() {
  const session = await auth();
  const email = session?.user?.email || "";
  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;
  if (!user) return <div className="container py-10">Unauthorized</div>;

  const cards = await prisma.card.findMany({
    where: { userId: user.id },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  async function toggle(id: string, next: "ACTIVE" | "FROZEN") {
    "use server";
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return;
    await prisma.card.update({ where: { id }, data: { status: next } });
    await prisma.auditLog.create({
      data: {
        userId: u.id,
        action: "CARD_TOGGLE",
        meta: `{"cardId":"${id}","to":"${next}"}`,
      },
    });
  }

  async function createCard() {
    "use server";
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return;
    const acct = await prisma.account.findFirst({
      where: { userId: u.id },
      orderBy: { createdAt: "asc" },
    });
    if (!acct) return;
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    await prisma.card.create({
      data: { userId: u.id, accountId: acct.id, last4, status: "ACTIVE" },
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-barclays-navy">Cards</h1>
        <form action={createCard}>
          <button className="btn-primary">Create new card</button>
        </form>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.id} className="card">
            <div className="text-sm text-gray-600">{c.account?.name}</div>
            <div className="text-2xl font-semibold mt-1">•••• {c.last4}</div>
            <div className="mt-1 text-xs">
              Status:{" "}
              <span
                className={
                  c.status === "ACTIVE" ? "text-green-700" : "text-red-600"
                }
              >
                {c.status}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <form
                action={toggle.bind(
                  null,
                  c.id,
                  c.status === "ACTIVE" ? "FROZEN" : "ACTIVE"
                )}
              >
                <button className="btn-secondary">
                  {c.status === "ACTIVE" ? "Freeze" : "Unfreeze"}
                </button>
              </form>
              <Link
                href={`/app/accounts/${c.accountId}`}
                className="btn-secondary"
              >
                Account
              </Link>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="text-sm text-gray-600">No cards found.</div>
        )}
      </div>
    </div>
  );
}

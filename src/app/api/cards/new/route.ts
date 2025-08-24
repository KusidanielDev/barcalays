// FILE: src/app/api/cards/new/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const { accountId } = await req.json().catch(() => ({}));

  const acct = await prisma.account.findFirst({
    where: { id: accountId, userId: user!.id },
  });
  if (!acct)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  const c = await prisma.card.create({
    data: { userId: user!.id, accountId: acct.id, last4 },
  });
  await prisma.auditLog.create({
    data: {
      userId: user!.id,
      action: "CARD_CREATE",
      meta: `{"cardId":"${c.id}"}`,
    },
  });
  return NextResponse.json({ card: c }, { status: 201 });
}

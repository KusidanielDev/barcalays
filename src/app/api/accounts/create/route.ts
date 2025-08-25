// FILE: src/app/api/accounts/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function rand4() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
function makeNumber() {
  return `${rand4()}${rand4()}${rand4()}`.slice(0, 10);
}
function makeSort() {
  return `${Math.floor(10 + Math.random() * 90)}-${Math.floor(
    10 + Math.random() * 90
  )}-${Math.floor(10 + Math.random() * 90)}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, type, initialDepositPence } = body as {
      name: string;
      type: "CURRENT" | "SAVINGS" | "INVESTMENT";
      initialDepositPence?: number;
    };

    if (!name || !type)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const number = makeNumber();
    const sortCode = makeSort();
    const balance = Math.max(0, Math.floor(initialDepositPence ?? 0));

    const acc = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type,
        number,
        sortCode,
        balance,
        currency: "GBP",
        status: "OPEN",
      },
    });

    if (balance > 0) {
      await prisma.transaction.create({
        data: {
          accountId: acc.id,
          postedAt: new Date(),
          description: "Initial funding",
          amount: balance,
          balanceAfter: balance,
        },
      });
    }

    return NextResponse.json({ ok: true, accountId: acc.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 400 }
    );
  }
}

// FILE: src/app/api/invest/create-account/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // See if user already has one
  const existing = await prisma.account.findFirst({
    where: {
      userId: user.id,
      type: "INVESTMENT",
      status: { in: ["OPEN", "PENDING"] },
    },
  });
  if (existing) return NextResponse.json({ ok: true, accountId: existing.id });

  const acct = await prisma.account.create({
    data: {
      userId: user.id,
      name: "General Investment Account",
      type: "INVESTMENT",
      number: `GI-${Math.floor(100000 + Math.random() * 900000)}`,
      sortCode: "23-45-67",
      balance: 2000000, // £20,000   cash
      currency: "GBP",
      status: "OPEN",
    },
  });

  return NextResponse.json({ ok: true, accountId: acct.id });
}

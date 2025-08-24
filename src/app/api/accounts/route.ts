// FILE: src/app/api/accounts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const accounts = await prisma.account.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const { name, type } = await req.json().catch(() => ({}));
  if (!name || !type)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // simple generators
  const number = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
  const sortCode = ["04", "00", "04"].join("-");

  const acct = await prisma.account.create({
    data: {
      userId: user!.id,
      name,
      type,
      number,
      sortCode,
      balance: 0,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user!.id,
      action: "ACCOUNT_CREATE",
      meta: `{"accountId":"${acct.id}"}`,
    },
  });
  return NextResponse.json({ account: acct }, { status: 201 });
}

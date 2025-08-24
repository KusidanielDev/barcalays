import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { userId, amountPence } = body || {};
  if (!userId || !amountPence) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const accounts = await prisma.account.findMany({ where: { userId } });
  if (!accounts.length) return NextResponse.json({ error: "No accounts for user" }, { status: 404 });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const a of accounts) {
      const newBal = a.balance + amountPence;
      await tx.account.update({ where: { id: a.id }, data: { balance: newBal } });
      await tx.transaction.create({
        data: { accountId: a.id, postedAt: now, description: "Admin credit", amount: amountPence, balanceAfter: newBal }
      });
    }
  });

  return NextResponse.json({ ok: true });
}

// FILE: src/app/api/payees/route.ts
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
  const payees = await prisma.payee.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ payees });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const b = await req.json().catch(() => null);
  if (!b?.name || !b?.sortCode || !b?.accountNumber)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const p = await prisma.payee.create({
    data: {
      userId: user!.id,
      name: b.name,
      sortCode: b.sortCode,
      accountNumber: b.accountNumber,
      reference: b.reference || null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user!.id,
      action: "PAYEE_CREATE",
      meta: `{"payeeId":"${p.id}"}`,
    },
  });
  return NextResponse.json({ payee: p });
}

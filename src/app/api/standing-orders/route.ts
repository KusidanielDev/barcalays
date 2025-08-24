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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.standingOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { fromAccount: true, payee: true },
  });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const { fromAccountId, payeeId, amountPence, schedule, note } =
    await req.json();
  if (!user || !fromAccountId || !payeeId || !amountPence || !schedule)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const so = await prisma.standingOrder.create({
    data: {
      userId: user.id,
      fromAccountId,
      payeeId,
      amount: amountPence,
      schedule,
      note,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "SO_CREATE",
      meta: JSON.stringify({ soId: so.id }),
    },
  });
  return NextResponse.json({ so });
}

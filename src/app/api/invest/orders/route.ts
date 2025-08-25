// FILE: src/app/api/invest/orders/route.ts
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "INVEST_ORDER",
      meta: JSON.stringify(body),
    },
  });

  return NextResponse.json({ ok: true });
}

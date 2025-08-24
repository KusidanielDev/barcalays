// FILE: src/app/api/cards/route.ts
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
  const cards = await prisma.card.findMany({
    where: { userId: user!.id },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ cards });
}

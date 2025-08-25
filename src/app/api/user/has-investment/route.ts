// FILE: src/app/api/user/has-investment/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ has: false });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ has: false });

  const count = await prisma.account.count({
    where: { userId: user.id, type: "INVESTMENT" },
  });
  return NextResponse.json({ has: count > 0 });
}

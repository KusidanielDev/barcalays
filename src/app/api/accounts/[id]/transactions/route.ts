import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accountId = params.id;
  const tx = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: { postedAt: "desc" },
    take: 25,
  });
  return NextResponse.json({ transactions: tx });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: {
        userId: user.id,
        type: "INVESTMENT",
        status: { in: ["OPEN", "PENDING"] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        number: true,
        balance: true,
        currency: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to load accounts" },
      { status: 400 }
    );
  }
}

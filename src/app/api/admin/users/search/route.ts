import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const users = await prisma.user.findMany({
    where: { OR: [{ email: { contains: q }}, { name: { contains: q }}] },
    orderBy: { createdAt: "desc" }, take: 50
  });
  return NextResponse.json({ users });
}

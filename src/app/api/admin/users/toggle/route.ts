import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, enable } = await req.json();
  const user = await prisma.user.update({ where: { id: userId }, data: { role: enable ? "USER":"USER" } });
  await prisma.auditLog.create({ data: { userId, action: enable ? "USER_ENABLE" : "USER_DISABLE" } });
  return NextResponse.json({ user });
}

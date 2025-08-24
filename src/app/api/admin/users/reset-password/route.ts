import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await req.json();
  const passwordHash = await bcrypt.hash("Temp123!"+Math.floor(Math.random()*1000), 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.auditLog.create({ data: { userId, action: "ADMIN_RESET_PASSWORD" } });
  return NextResponse.json({ ok: true });
}

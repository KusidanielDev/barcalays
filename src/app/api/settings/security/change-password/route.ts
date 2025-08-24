import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  const ok = await bcrypt.compare(currentPassword || "", user.passwordHash);
  if (!ok)
    return NextResponse.json(
      { error: "Current password incorrect" },
      { status: 400 }
    );
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGE" },
  });
  return NextResponse.json({ ok: true });
}

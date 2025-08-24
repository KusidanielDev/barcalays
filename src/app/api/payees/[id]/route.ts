import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.payee.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PAYEE_DELETE",
      meta: JSON.stringify({ payeeId: params.id }),
    },
  });
  return NextResponse.json({ ok: true });
}

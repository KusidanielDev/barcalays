import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { active, note } = await req.json();
  const so = await prisma.standingOrder.update({
    where: { id: params.id },
    data: { active, note },
  });
  await prisma.auditLog.create({
    data: {
      userId: so.userId,
      action: "SO_UPDATE",
      meta: JSON.stringify({ soId: so.id, active, note }),
    },
  });
  return NextResponse.json({ so });
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const so = await prisma.standingOrder.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      userId: so.userId,
      action: "SO_DELETE",
      meta: JSON.stringify({ soId: so.id }),
    },
  });
  return NextResponse.json({ ok: true });
}

// FILE: src/app/api/cards/[id]/toggle/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const card = await prisma.card.findFirst({
    where: { id: params.id, userId: user!.id },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = card.status === "ACTIVE" ? "FROZEN" : "ACTIVE";
  await prisma.card.update({ where: { id: card.id }, data: { status: next } });
  await prisma.auditLog.create({
    data: {
      userId: user!.id,
      action: "CARD_TOGGLE",
      meta: `{"cardId":"${card.id}","to":"${next}"}`,
    },
  });
  return NextResponse.json({ ok: true, status: next });
}

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
  const { action } = await req.json();
  if (!["LOCK", "UNLOCK", "REISSUE"].includes(action))
    return NextResponse.json({ error: "Bad action" }, { status: 400 });

  const card = await prisma.card.findUnique({ where: { id: params.id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const status =
    action === "LOCK"
      ? "LOCKED"
      : action === "UNLOCK"
      ? "ACTIVE"
      : "REISSUE_PENDING";
  const updated = await prisma.card.update({
    where: { id: params.id },
    data: { status },
  });
  await prisma.auditLog.create({
    data: {
      userId: card.userId,
      action: `CARD_${action}`,
      meta: JSON.stringify({ cardId: card.id }),
    },
  });
  return NextResponse.json({ card: updated });
}

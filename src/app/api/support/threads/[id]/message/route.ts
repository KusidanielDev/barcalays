import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const { body } = await req.json();
  const m = await prisma.supportMessage.create({
    data: { threadId: params.id, author: "USER", body },
  });
  await prisma.auditLog.create({
    data: {
      userId: u!.id,
      action: "SUPPORT_MESSAGE",
      meta: JSON.stringify({ threadId: params.id }),
    },
  });
  return NextResponse.json({ message: m });
}

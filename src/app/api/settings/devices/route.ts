// FILE: src/app/api/settings/devices/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const sessions = await prisma.session.findMany({
    where: { userId: user!.id },
    orderBy: { expires: "desc" },
  });
  return NextResponse.json({ sessions });
}

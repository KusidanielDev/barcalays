import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(){
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { email: session.user.email } });
  const threads = await prisma.supportThread.findMany({ where: { userId: u!.id }, include: { messages: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ threads });
}

export async function POST(req: Request){
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { email: session.user.email } });
  const { subject, body } = await req.json();
  const t = await prisma.supportThread.create({ data: { userId: u!.id, subject, messages: { create: [{ author: "USER", body }] } } });
  return NextResponse.json({ thread: t });
}

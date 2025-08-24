import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(){
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { email: session.user.email } });
  const goals = await prisma.goal.findMany({ where: { userId: u!.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ goals });
}

export async function POST(req: Request){
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { email: session.user.email } });
  const { name, target, deadline } = await req.json();
  const g = await prisma.goal.create({ data: { userId: u!.id, name, target, deadline: deadline ? new Date(deadline) : null } });
  return NextResponse.json({ goal: g });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(){
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { email: session.user.email } });
  const budgets = await prisma.budget.findMany({ where: { userId: u!.id }, include: { items: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ budgets });
}

export async function POST(req: Request){
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { email: session.user.email } });
  const { name, month, limit, items } = await req.json();
  const b = await prisma.budget.create({ data: { userId: u!.id, name, month, limit, items: { create: items || [] } } });
  return NextResponse.json({ budget: b });
}

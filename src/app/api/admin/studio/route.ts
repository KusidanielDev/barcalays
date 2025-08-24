// FILE: src/app/api/admin/studio/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowed = new Set([
  "User",
  "Account",
  "Transaction",
  "Payment",
  "Card",
  "Payee",
  "StandingOrder",
  "NotificationPref",
  "Budget",
  "BudgetItem",
  "Goal",
  "SupportThread",
  "SupportMessage",
  "Session",
]);

function safeModel(m: string) {
  if (!allowed.has(m)) throw new Error("Model not allowed");
  return m as keyof typeof prisma;
}

export async function GET(req: Request) {
  const session = await auth();
  // @ts-ignore
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const model = safeModel(searchParams.get("model") || "User");
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 20))
  );

  const where: any = {};
  // crude filter across common columns
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { email: { contains: q } },
      { name: { contains: q } },
      { number: { contains: q } },
      { sortCode: { contains: q } },
      { status: { contains: q } },
    ];
  }

  // @ts-ignore
  const total = await prisma[model].count({ where });
  // @ts-ignore
  const items = await prisma[model].findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({ total, items });
}

export async function PUT(req: Request) {
  const session = await auth();
  // @ts-ignore
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { model: m, id, data } = await req.json().catch(() => ({}));
  const model = safeModel(String(m));
  const parsed = (() => {
    try {
      return JSON.parse(String(data || "{}"));
    } catch {
      return null;
    }
  })();
  if (!id || !parsed)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Avoid changing primary key
  delete parsed.id;

  // @ts-ignore
  const updated = await prisma[model].update({
    where: { id: String(id) },
    data: parsed,
  });
  return NextResponse.json({ updated });
}

export async function DELETE(req: Request) {
  const session = await auth();
  // @ts-ignore
  if ((session?.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { model: m, id } = await req.json().catch(() => ({}));
  const model = safeModel(String(m));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // @ts-ignore
  await prisma[model].delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}

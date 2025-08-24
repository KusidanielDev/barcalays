// FILE: src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!name || !email || !password)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists)
    return NextResponse.json({ error: "Email in use" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, approved: false },
  });

  // redirect to a pending page
  return NextResponse.json({ ok: true, redirect: "/pending" });
}

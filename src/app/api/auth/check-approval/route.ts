// FILE: src/app/api/auth/check-approval/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ exists: false, approved: false });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ exists: false, approved: false });

  return NextResponse.json({
    exists: true,
    approved: Boolean((user as any).approved),
  });
}

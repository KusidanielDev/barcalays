// FILE: src/app/api/settings/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, phone, alerts } = body || {};
  await prisma.user
    .update({
      where: { email: session.user.email },
      data: {
        name: String(name || ""),
        phone: String(phone || ""),
        alertsEnabled: !!alerts,
      },
    })
    .catch(() => {});
  await prisma.auditLog.create({
    data: {
      userId: session.user.id as string | undefined,
      action: "SETTINGS_UPDATE",
      meta: `{"name":"${name || ""}","phone":"${
        phone || ""
      }","alerts":${!!alerts}}`,
    },
  });
  return NextResponse.json({ ok: true });
}

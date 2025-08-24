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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let pref = await prisma.notificationPref.findUnique({
    where: { userId: user.id },
  });
  if (!pref)
    pref = await prisma.notificationPref.create({ data: { userId: user.id } });
  return NextResponse.json({ pref });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { emailTx, smsTx, appAlerts } = await req.json();
  const pref = await prisma.notificationPref.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      emailTx: !!emailTx,
      smsTx: !!smsTx,
      appAlerts: !!appAlerts,
    },
    update: { emailTx: !!emailTx, smsTx: !!smsTx, appAlerts: !!appAlerts },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "NOTIF_PREF_UPDATE",
      meta: JSON.stringify({ emailTx, smsTx, appAlerts }),
    },
  });
  return NextResponse.json({ pref });
}

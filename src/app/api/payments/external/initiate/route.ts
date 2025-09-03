import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toPence(input: unknown): number {
  // Accept either { amountPence } or { amount } in pounds
  const v = Number(input);
  if (!Number.isFinite(v)) return NaN;
  // If it's a big integer (>= 1000) we assume caller passed pence already.
  // Otherwise treat as pounds and convert.
  return v >= 1000 ? Math.round(v) : Math.round(v * 100);
}

function otp6(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const fromAccountId = String(body.fromAccountId || "");
  const payeeId = body.payeeId ? String(body.payeeId) : null;
  const description = body.description ? String(body.description) : null;

  // Support {amountPence} or {amount} (pounds)
  const amountPence = toPence(
    body.amountPence ?? body.amount // prefer explicit pence, fallback to pounds
  );

  if (!fromAccountId || !Number.isFinite(amountPence) || amountPence <= 0) {
    return NextResponse.json(
      { error: "Missing/invalid fields" },
      { status: 400 }
    );
  }

  // Verify the account exists (optionally check ownership)
  const from = await prisma.account.findUnique({
    where: { id: fromAccountId },
  });
  if (!from) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const otpCode = otp6();

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      fromAccountId,
      payeeId,
      amountPence, // <-- matches your Prisma schema
      description,
      isExternal: true,
      status: "PENDING_OTP",
      otpCode,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "PAYMENT_INIT",
      meta: JSON.stringify({
        paymentId: payment.id,
        fromAccountId,
        payeeId,
        amountPence,
        isExternal: true,
      }),
    },
  });

  // In real life you would deliver OTP out-of-band; for   we return it
  return NextResponse.json({ paymentId: payment.id, otpPreview: otpCode });
}

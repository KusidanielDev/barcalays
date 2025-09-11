// FILE: src/app/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Auth (same as old)
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Payload (same keys as old: { id, otp })
  const { id, otp } = await req.json().catch(() => ({} as any));
  if (!id || !otp) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Only confirm payments owned by the user and still pending
  const p = await prisma.payment.findFirst({
    where: { id, userId: user.id, status: "PENDING_OTP" },
  });
  if (!p) {
    return NextResponse.json(
      { error: "Payment not found or already processed" },
      { status: 404 }
    );
  }

  if (String(otp) !== String(p.otpCode || "")) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  // Debit & settle inside a transaction
  return prisma.$transaction(async (tx) => {
    const from = await tx.account.findFirst({
      where: { id: p.fromAccountId, userId: user.id },
    });
    if (!from) {
      return NextResponse.json(
        { error: "From account not found" },
        { status: 404 }
      );
    }
    if (from.balance < p.amountPence) {
      return NextResponse.json(
        { error: "Insufficient funds" },
        { status: 400 }
      );
    }

    const newBal = from.balance - p.amountPence;

    await tx.account.update({
      where: { id: from.id },
      data: { balance: newBal },
    });

    await tx.transaction.create({
      data: {
        accountId: from.id,
        postedAt: new Date(),
        description: p.description || "Payment",
        amount: -p.amountPence,
        balanceAfter: newBal,
        status: "POSTED", // new enum status field
      },
    });

    await tx.payment.update({
      where: { id: p.id },
      data: { status: "COMPLETED", otpCode: null },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_COMPLETE",
        meta: `{"paymentId":"${p.id}"}`,
      },
    });

    return NextResponse.json({ ok: true });
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentId = String(body.paymentId || "");
  const otp = String(body.otp || "");

  if (!paymentId || !otp) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment)
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "PENDING_OTP") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }
  if (!payment.otpCode || payment.otpCode !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  // Use amountPence from your schema
  const amt = payment.amountPence;
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const from = await prisma.account.findUnique({
    where: { id: payment.fromAccountId },
  });
  if (!from)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (from.balance < amt) {
    return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const newBal = from.balance - amt;

    await tx.account.update({
      where: { id: from.id },
      data: { balance: newBal },
    });

    await tx.transaction.create({
      data: {
        accountId: from.id,
        postedAt: new Date(),
        description: payment.description || "External payment",
        amount: -amt, // ledger keeps pence; negative for outflow
        balanceAfter: newBal,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", otpCode: null },
    });

    await tx.auditLog.create({
      data: {
        userId: payment.userId,
        action: "PAYMENT_COMPLETED",
        meta: JSON.stringify({
          paymentId: payment.id,
          amountPence: amt,
          fromAccountId: from.id,
          external: true,
        }),
      },
    });
  });

  return NextResponse.json({ ok: true });
}

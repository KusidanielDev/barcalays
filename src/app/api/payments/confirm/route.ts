// FILE: src/app/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const { id, otp } = await req.json().catch(() => ({}));

  const p = await prisma.payment.findFirst({
    where: { id, userId: user!.id, status: "PENDING_OTP" },
  });
  if (!p)
    return NextResponse.json(
      { error: "Payment not found or already processed" },
      { status: 404 }
    );
  if (String(otp) !== String(p.otpCode || ""))
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

  // settle payment: debit from account, create transaction
  const from = await prisma.account.findFirst({
    where: { id: p.fromAccountId, userId: user!.id },
  });
  if (!from)
    return NextResponse.json(
      { error: "From account not found" },
      { status: 404 }
    );
  if (from.balance < p.amountPence)
    return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

  const newBal = from.balance - p.amountPence;
  await prisma.$transaction(async (tx) => {
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
      },
    });
    await tx.payment.update({
      where: { id: p.id },
      data: { status: "COMPLETED", otpCode: null },
    });
    await tx.auditLog.create({
      data: {
        userId: user!.id,
        action: "PAYMENT_COMPLETE",
        meta: `{"paymentId":"${p.id}"}`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

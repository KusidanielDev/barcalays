// FILE: src/app/api/payments/external/confirm/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Auth (from your old code)
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const paymentId = String(body.paymentId || "");
  const otp = String(body.otp || "");
  if (!paymentId || !otp) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Find payment (external bank or vendor), still pending
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment)
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "PENDING_OTP") {
    return NextResponse.json({ error: "Already processed" }, { status: 400 });
  }
  if (!payment.otpCode || payment.otpCode !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

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

  // Prefer a vendor-flavored description when applicable
  const desc =
    payment.description ||
    (payment.method === "VENDOR" && payment.vendor && payment.vendorHandle
      ? `${payment.vendor} payment to ${payment.vendorHandle}`
      : "External payment");

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
        description: desc,
        amount: -amt, // outflow in pence
        balanceAfter: newBal,
        status: "POSTED", // merged-in enum status
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
          method: payment.method ?? null, // BANK | VENDOR
          vendor: payment.vendor ?? null, // PAYPAL | WISE | REVOLUT
          vendorHandle: payment.vendorHandle ?? null,
        }),
      },
    });
  });

  return NextResponse.json({ ok: true });
}

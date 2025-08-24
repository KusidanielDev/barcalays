// FILE: src/app/api/payments/route.ts
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
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  // Internal transfer
  if (b.kind === "INTERNAL") {
    const { fromAccountId, toAccountId, amountPence, description } = b;
    if (!fromAccountId || !toAccountId || !amountPence)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (fromAccountId === toAccountId)
      return NextResponse.json(
        { error: "Select two different accounts" },
        { status: 400 }
      );

    return await prisma.$transaction(async (tx) => {
      const from = await tx.account.findFirst({
        where: { id: fromAccountId, userId: user!.id },
      });
      const to = await tx.account.findFirst({
        where: { id: toAccountId, userId: user!.id },
      });
      if (!from || !to)
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      if (from.balance < amountPence)
        return NextResponse.json(
          { error: "Insufficient funds" },
          { status: 400 }
        );

      const newFrom = from.balance - amountPence;
      const newTo = to.balance + amountPence;
      await tx.account.update({
        where: { id: from.id },
        data: { balance: newFrom },
      });
      await tx.account.update({
        where: { id: to.id },
        data: { balance: newTo },
      });

      const now = new Date();
      await tx.transaction.create({
        data: {
          accountId: from.id,
          postedAt: now,
          description: description || "Transfer out",
          amount: -amountPence,
          balanceAfter: newFrom,
        },
      });
      await tx.transaction.create({
        data: {
          accountId: to.id,
          postedAt: now,
          description: description || "Transfer in",
          amount: amountPence,
          balanceAfter: newTo,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user!.id,
          action: "TRANSFER_INTERNAL",
          meta: `{"from":"${from.id}","to":"${to.id}","amount":${amountPence}}`,
        },
      });
      return NextResponse.json({ ok: true });
    });
  }

  // External payment (saved payee or new payee)
  if (b.kind === "EXTERNAL") {
    const { fromAccountId, amountPence, description, payeeId, payee } = b;
    if (!fromAccountId || !amountPence)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const from = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: user!.id },
    });
    if (!from)
      return NextResponse.json(
        { error: "From account not found" },
        { status: 404 }
      );
    if (from.balance < amountPence)
      return NextResponse.json(
        { error: "Insufficient funds" },
        { status: 400 }
      );

    let thePayeeId = payeeId as string | undefined;
    if (!thePayeeId && payee) {
      const np = await prisma.payee.create({
        data: {
          userId: user!.id,
          name: payee.name,
          sortCode: payee.sortCode,
          accountNumber: payee.accountNumber,
          reference: payee.reference || null,
        },
      });
      thePayeeId = np.id;
    }
    if (!thePayeeId)
      return NextResponse.json(
        { error: "Choose or create a payee" },
        { status: 400 }
      );

    // Create pending payment with OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const p = await prisma.payment.create({
      data: {
        userId: user!.id,
        fromAccountId: from.id,
        payeeId: thePayeeId,
        amountPence,
        description: description || "Payment",
        isExternal: true,
        status: "PENDING_OTP",
        otpCode: otp,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "PAYMENT_CREATE",
        meta: `{"paymentId":"${p.id}"}`,
      },
    });

    // In a real system, send OTP via SMS/App. Here we just return pending id.
    return NextResponse.json({ pendingPaymentId: p.id });
  }

  return NextResponse.json({ error: "Unknown payment kind" }, { status: 400 });
}

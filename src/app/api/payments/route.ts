// FILE: src/app/api/payments/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vendorPaymentInitSchema } from "@/lib/validators";

export async function POST(req: Request) {
  // ---- Auth (narrow email to plain string) ----
  const session = await auth();
  const email =
    typeof session?.user?.email === "string" ? session.user.email : undefined;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ---- Parse body ----
  const b = (await req.json().catch(() => null)) as any;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  /* =========================
   * INTERNAL transfer
   * ========================= */
  if (b.kind === "INTERNAL") {
    const { fromAccountId, toAccountId, amountPence, description } = b as {
      fromAccountId?: string;
      toAccountId?: string;
      amountPence?: number;
      description?: string;
    };

    if (!fromAccountId || !toAccountId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!Number.isInteger(amountPence) || amountPence! <= 0)
      return NextResponse.json(
        { error: "Amount must be a positive integer (pence)" },
        { status: 400 }
      );
    if (fromAccountId === toAccountId)
      return NextResponse.json(
        { error: "Select two different accounts" },
        { status: 400 }
      );

    return prisma.$transaction(async (tx) => {
      const from = await tx.account.findFirst({
        where: { id: fromAccountId, userId: user.id },
      });
      const to = await tx.account.findFirst({
        where: { id: toAccountId, userId: user.id },
      });

      if (!from || !to)
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      if (from.balance < amountPence!)
        return NextResponse.json(
          { error: "Insufficient funds" },
          { status: 400 }
        );

      const newFrom = from.balance - amountPence!;
      const newTo = to.balance + amountPence!;

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
          amount: -amountPence!,
          balanceAfter: newFrom,
          status: "POSTED",
        },
      });
      await tx.transaction.create({
        data: {
          accountId: to.id,
          postedAt: now,
          description: description || "Transfer in",
          amount: amountPence!,
          balanceAfter: newTo,
          status: "POSTED",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TRANSFER_INTERNAL",
          meta: JSON.stringify({
            from: from.id,
            to: to.id,
            amount: amountPence,
          }),
        },
      });

      return NextResponse.json({ ok: true });
    });
  }

  /* =========================
   * EXTERNAL (bank) payment
   *  - supports saved payee (payeeId)
   *  - or create-new payee via `payee` object
   * ========================= */
  if (b.kind === "EXTERNAL") {
    const { fromAccountId, amountPence, description, payeeId, payee } = b as {
      fromAccountId?: string;
      amountPence?: number;
      description?: string;
      payeeId?: string;
      payee?: {
        name: string;
        sortCode: string;
        accountNumber: string;
        reference?: string;
      };
    };

    if (!fromAccountId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!Number.isInteger(amountPence) || amountPence! <= 0)
      return NextResponse.json(
        { error: "Amount must be a positive integer (pence)" },
        { status: 400 }
      );

    const from = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: user.id },
    });
    if (!from)
      return NextResponse.json(
        { error: "From account not found" },
        { status: 404 }
      );
    if (from.balance < amountPence!)
      return NextResponse.json(
        { error: "Insufficient funds" },
        { status: 400 }
      );

    let thePayeeId: string | undefined =
      typeof payeeId === "string" && payeeId ? payeeId : undefined;

    if (!thePayeeId && payee) {
      const np = await prisma.payee.create({
        data: {
          userId: user.id,
          name: payee.name,
          sortCode: payee.sortCode,
          accountNumber: payee.accountNumber,
          reference: payee.reference ?? null,
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
        userId: user.id,
        fromAccountId: from.id,
        payeeId: thePayeeId,
        amountPence: amountPence!,
        description: description || "Payment",
        isExternal: true,
        status: "PENDING_OTP",
        otpCode: otp,
        method: "BANK",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_CREATE",
        meta: JSON.stringify({ paymentId: p.id }),
      },
    });

    // In production: send OTP via SMS/App. Here we return the pending id.
    return NextResponse.json({ pendingPaymentId: p.id });
  }

  /* =========================
   * EXTERNAL_VENDOR
   *  - PayPal / Wise / Revolut
   * ========================= */
  if (b.kind === "EXTERNAL_VENDOR") {
    const parsed = vendorPaymentInitSchema.safeParse(b);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );

    const { fromAccountId, amountPence, description, vendor, vendorHandle } =
      parsed.data;

    if (!Number.isInteger(amountPence) || amountPence <= 0)
      return NextResponse.json(
        { error: "Amount must be a positive integer (pence)" },
        { status: 400 }
      );

    const from = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: user.id },
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

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const p = await prisma.payment.create({
      data: {
        userId: user.id,
        fromAccountId,
        amountPence,
        description: description || `${vendor} payment to ${vendorHandle}`,
        isExternal: true,
        status: "PENDING_OTP",
        otpCode: otp,
        method: "VENDOR",
        vendor,
        vendorHandle,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_CREATE_VENDOR",
        meta: JSON.stringify({
          paymentId: p.id,
          vendor,
          vendorHandle,
          amountPence,
        }),
      },
    });

    return NextResponse.json({ pendingPaymentId: p.id });
  }

  return NextResponse.json({ error: "Unknown payment kind" }, { status: 400 });
}

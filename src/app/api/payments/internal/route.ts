// FILE: src/app/api/payments/internal/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { internalTransferSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = internalTransferSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fromAccountId, toAccountId, amountPence, description } = parsed.data;

  if (fromAccountId === toAccountId) {
    return NextResponse.json(
      { error: "From and to must differ" },
      { status: 400 }
    );
  }

  // Do everything atomically
  const result = await prisma
    .$transaction(async (tx) => {
      const from = await tx.account.findUnique({
        where: { id: fromAccountId },
      });
      const to = await tx.account.findUnique({ where: { id: toAccountId } });

      if (!from || !to) {
        throw new Error("NOT_FOUND");
      }
      if (from.userId !== user.id || to.userId !== user.id) {
        throw new Error("FORBIDDEN");
      }
      if (from.balance < amountPence) {
        throw new Error("INSUFFICIENT");
      }

      const now = new Date();
      const newFromBal = from.balance - amountPence;
      const newToBal = to.balance + amountPence;

      await tx.account.update({
        where: { id: from.id },
        data: { balance: newFromBal },
      });
      await tx.account.update({
        where: { id: to.id },
        data: { balance: newToBal },
      });

      const tOut = await tx.transaction.create({
        data: {
          accountId: from.id,
          postedAt: now,
          description: description || "Transfer out",
          amount: -amountPence,
          balanceAfter: newFromBal,
        },
      });

      const tIn = await tx.transaction.create({
        data: {
          accountId: to.id,
          postedAt: now,
          description: description || "Transfer in",
          amount: amountPence,
          balanceAfter: newToBal,
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          fromAccountId,
          amountPence, // ✅ use amountPence per schema
          description,
          isExternal: false,
          status: "COMPLETED",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TRANSFER_INTERNAL",
          meta: JSON.stringify({
            paymentId: payment.id,
            amountPence,
            fromAccountId,
            toAccountId,
            tOut: tOut.id,
            tIn: tIn.id,
          }),
        },
      });

      return { paymentId: payment.id };
    })
    .catch((e) => {
      if (e instanceof Error) {
        if (e.message === "NOT_FOUND")
          return { error: "Account not found", status: 404 };
        if (e.message === "FORBIDDEN")
          return { error: "Forbidden", status: 403 };
        if (e.message === "INSUFFICIENT")
          return { error: "Insufficient funds", status: 400 };
      }
      return { error: "Internal error", status: 500 };
    });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true, paymentId: result.paymentId });
}

// FILE: src/app/api/transfer/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const fromAccountId = String(body.fromAccountId || "");
  const toAccountId = String(body.toAccountId || "");
  const amountPence = Number(body.amountPence);
  const description = body.description ? String(body.description) : null;

  if (
    !fromAccountId ||
    !toAccountId ||
    !Number.isFinite(amountPence) ||
    amountPence <= 0
  ) {
    return NextResponse.json(
      { error: "Missing/invalid fields" },
      { status: 400 }
    );
  }
  if (fromAccountId === toAccountId) {
    return NextResponse.json(
      { error: "From and to must differ" },
      { status: 400 }
    );
  }

  const result = await prisma
    .$transaction(async (tx) => {
      const from = await tx.account.findUnique({
        where: { id: fromAccountId },
      });
      const to = await tx.account.findUnique({ where: { id: toAccountId } });

      if (!from || !to) {
        throw new Error("NOT_FOUND");
      }
      if (from.userId !== dbUser.id || to.userId !== dbUser.id) {
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
          amount: -amountPence, // ledger in pence (negative = outflow)
          balanceAfter: newFromBal,
        },
      });

      const tIn = await tx.transaction.create({
        data: {
          accountId: to.id,
          postedAt: now,
          description: description || "Transfer in",
          amount: amountPence, // pence (inflow)
          balanceAfter: newToBal,
        },
      });

      await tx.payment.create({
        data: {
          userId: dbUser.id,
          fromAccountId,
          amountPence, // ✅ matches your Prisma schema
          description,
          isExternal: false,
          status: "COMPLETED",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: dbUser.id, // ✅ guaranteed non-null
          action: "TRANSFER_INTERNAL",
          meta: JSON.stringify({
            from: from.id,
            to: to.id,
            amountPence,
            tOut: tOut.id,
            tIn: tIn.id,
          }),
        },
      });

      return { ok: true };
    })
    .catch((e: any) => {
      if (e?.message === "NOT_FOUND")
        return { error: "Account not found", status: 404 };
      if (e?.message === "FORBIDDEN")
        return { error: "Forbidden", status: 403 };
      if (e?.message === "INSUFFICIENT")
        return { error: "Insufficient funds", status: 400 };
      return { error: "Internal error", status: 500 };
    });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true });
}

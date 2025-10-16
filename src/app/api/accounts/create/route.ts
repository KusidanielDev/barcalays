// FILE: src/app/api/accounts/create/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TxStatus } from "@prisma/client";

/** helpers for number/sort-code */
function rand(n: number) {
  return Math.floor(Math.random() * n);
}
function accountNumber8() {
  return String(10_000_000 + rand(89_999_999));
}
function sortCode() {
  const a = 10 + rand(90);
  const b = 10 + rand(90);
  const c = 10 + rand(90);
  return `${a}-${b}-${c}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = (body.name || "Everyday Account").trim();
    const type: "CURRENT" | "SAVINGS" | "INVESTMENT" = (
      body.type || "CURRENT"
    ).toUpperCase();
    const currency = String(body.currency || "GBP").toUpperCase();
    // Accept either pence/paise/cents or a major-unit float
    const initialDepositPence: number =
      typeof body.initialDepositPence === "number"
        ? Math.max(0, Math.floor(body.initialDepositPence))
        : typeof body.initialDepositMajor === "number"
        ? Math.max(0, Math.round(body.initialDepositMajor * 100))
        : 0;

    const number = accountNumber8();

    const acc = await prisma.account.create({
      data: {
        userId: session.user.id,
        name,
        type,
        number,
        sortCode: sortCode(),
        balance: initialDepositPence,
        currency,
        status: "OPEN",
      },
    });

    if (initialDepositPence > 0) {
      await prisma.transaction.create({
        data: {
          accountId: acc.id,
          postedAt: new Date(),
          description: "Initial deposit",
          amount: initialDepositPence,
          balanceAfter: initialDepositPence,
          status: TxStatus.POSTED,
        },
      });
    }

    return NextResponse.json({ ok: true, accountId: acc.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 400 }
    );
  }
}

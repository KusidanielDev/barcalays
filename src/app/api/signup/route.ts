// FILE: src/app/api/signup/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function genAccountNumber() {
  return String(Math.floor(1_00000000 + Math.random() * 9_00000000)).padStart(
    8,
    "0"
  );
}
const DEFAULT_SORT = "20-00-00";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name = "",
      email = "",
      password = "",
      accountType = "CURRENT",
    } = body || {};

    if (!name.trim() || !email.trim() || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1) Create user (kept pending/awaiting approval)
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          passwordHash,
          approved: false,
          status: "PENDING",
        },
      });

      // 2) Create the EXACT account the user selected
      const type = String(accountType).toUpperCase();
      const accountName =
        type === "SAVINGS"
          ? "Savings Account"
          : type === "INVESTMENT"
          ? "Investment Account"
          : "Current Account";

      const acct = await tx.account.create({
        data: {
          userId: user.id,
          name: accountName,
          type, // String in your schema
          number: genAccountNumber(),
          sortCode: DEFAULT_SORT,
          balance: 0, // pence
          currency: "GBP",
          status: "PENDING", // matches your schema default
        },
      });

      // 3) Audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ACCOUNT_CREATE",
          meta: JSON.stringify({ accountId: acct.id, type }),
        },
      });

      return { userId: user.id, accountId: acct.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Signup failed" },
      { status: 500 }
    );
  }
}

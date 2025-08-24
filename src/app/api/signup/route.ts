import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function genAccountNumber() {
  // 8 digits, left-padded, e.g. "12345678"
  return String(Math.floor(1_00000000 + Math.random() * 9_00000000)).padStart(
    8,
    "0"
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name = "", email = "", password = "" } = body || {};

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

      // 2) Create default SAVINGS account with £0.00
      const savings = await tx.account.create({
        data: {
          userId: user.id,
          name: "Savings Account",
          type: "SAVINGS",
          number: genAccountNumber(),
          sortCode: "20-00-00",
          balance: 0, // pence => £0.00
          currency: "GBP",
        },
      });

      // 3) Audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "ACCOUNT_CREATE",
          meta: JSON.stringify({ accountId: savings.id, type: "SAVINGS" }),
        },
      });

      return { userId: user.id, savingsAccountId: savings.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Signup failed" },
      { status: 500 }
    );
  }
}

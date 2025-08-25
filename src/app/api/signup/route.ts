// FILE: src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const {
    name,
    email,
    password,
    confirmPassword,
    dob,
    phone,
    address,
    city,
    postcode,
    acceptTerms,
    accountType = "CURRENT",
  } = body;

  if (!email || !password || !confirmPassword)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (password !== confirmPassword)
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  if (!acceptTerms)
    return NextResponse.json(
      { error: "Terms must be accepted" },
      { status: 400 }
    );

  const emailNorm = String(email).toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (exists)
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: emailNorm,
      passwordHash,
      phone,
      approved: true,
      status: "APPROVED",
    },
  });

  // Create the chosen account
  const number = `${
    accountType === "INVESTMENT"
      ? "GI"
      : accountType === "SAVINGS"
      ? "SV"
      : "CU"
  }-${Math.floor(100000 + Math.random() * 900000)}`;
  const acc = await prisma.account.create({
    data: {
      userId: user.id,
      name:
        accountType === "INVESTMENT"
          ? "General Investment Account"
          : accountType === "SAVINGS"
          ? "Everyday Saver"
          : "Barclays Bank Account",
      type: accountType, // CURRENT | SAVINGS | INVESTMENT
      number,
      sortCode: "23-45-67",
      balance: accountType === "INVESTMENT" ? 1000000 : 50000, // £10,000 demo or £500 balance
      currency: "GBP",
      status: "OPEN",
    },
  });

  return NextResponse.json({ ok: true, userId: user.id, accountId: acc.id });
}

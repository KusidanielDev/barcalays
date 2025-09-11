// FILE: prisma/seed-new.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const GBP = (pounds: number) => Math.round(pounds * 100);

async function main() {
  // --- Admin (safe upsert; won’t affect Amarisa or others) ---
  const passHash = await hash("Password123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@demo.bank" },
    update: { role: "ADMIN" as any },
    create: {
      email: "admin@demo.bank",
      passwordHash: passHash as any,
      role: "ADMIN" as any,
      ...({ fullName: "Demo Admin" } as any),
      ...({ approved: true, status: "APPROVED" } as any),
    } as any,
  });

  // --- New user (distinct from Amarisa) ---
  const user = await prisma.user.upsert({
    where: { email: "user@demo.bank" },
    update: {},
    create: {
      email: "user@demo.bank",
      passwordHash: passHash as any,
      role: "USER" as any,
      ...({ fullName: "Demo User" } as any),
      ...({ approved: true, status: "APPROVED" } as any),
    } as any,
  });

  // --- One NEW account for the new user (unique number so it won’t collide) ---
  const account = await prisma.account.upsert({
    where: { number: "20020001" },
    update: {
      userId: user.id,
      name: "Main",
      currency: "GBP",
      balance: GBP(1_250), // £1,250.00
      ...({ status: "OPEN" } as any),
      ...({ type: "CURRENT" } as any),
    },
    create: {
      userId: user.id,
      name: "Main",
      number: "20020001",
      currency: "GBP",
      balance: GBP(1_250),
      sortCode: "12-34-56",
      ...({ status: "OPEN" } as any),
      ...({ type: "CURRENT" } as any),
    },
  });

  // --- Transactions (with status/adminMessage) ---
  const now = new Date();
  await prisma.transaction.createMany({
    data: [
      {
        accountId: account.id,
        postedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
        description: "Groceries",
        amount: -GBP(42.73),
        balanceAfter: GBP(1_207.27),
        status: "POSTED" as any,
      },
      {
        accountId: account.id,
        postedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        description: "Ride share",
        amount: -GBP(12),
        balanceAfter: GBP(1_195.27),
        status: "PENDING" as any,
        adminMessage: "Merchant batch not settled" as any,
      },
      {
        accountId: account.id,
        postedAt: new Date(now.getTime() - 1000 * 60 * 30),
        description: "Refund from store",
        amount: GBP(15),
        balanceAfter: GBP(1_210.27),
        status: "REVERSED" as any,
        adminMessage: "Reversed due to duplicate" as any,
      },
    ],
  });

  // --- Recurring Income (MONTHLY salary) ---
  await prisma.recurringIncome.upsert({
    where: { id: `ri-${user.id}-main` }, // synthetic stable key to avoid dupes on re-run
    update: {
      userId: user.id,
      accountId: account.id,
      name: "Monthly Salary",
      amountPence: GBP(1_800), // £1,800.00
      interval: "MONTHLY" as any,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 2), // +2h
      active: true,
    },
    create: {
      id: `ri-${user.id}-main`,
      userId: user.id,
      accountId: account.id,
      name: "Monthly Salary",
      amountPence: GBP(1_800),
      interval: "MONTHLY" as any,
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
      active: true,
    },
  });

  // --- Saved Payee (for bank external payments) ---
  const payee = await prisma.payee.upsert({
    where: { id: `py-${user.id}-sam` },
    update: {
      userId: user.id,
      name: "Sam Example",
      sortCode: "20-00-00",
      accountNumber: "12345678",
      reference: "Rent",
    },
    create: {
      id: `py-${user.id}-sam`,
      userId: user.id,
      name: "Sam Example",
      sortCode: "20-00-00",
      accountNumber: "12345678",
      reference: "Rent",
    },
  });

  // --- External BANK payment pending OTP ---
  await prisma.payment.upsert({
    where: { id: `p-bank-${user.id}-1` },
    update: {},
    create: {
      id: `p-bank-${user.id}-1`,
      userId: user.id,
      fromAccountId: account.id,
      payeeId: payee.id,
      amountPence: GBP(550), // £550.00
      description: "Rent payment",
      isExternal: true,
      status: "PENDING_OTP",
      otpCode: "123456",
      ...({ method: "BANK" } as any),
    },
  });

  // --- External VENDOR payment pending OTP (e.g., PayPal) ---
  await prisma.payment.upsert({
    where: { id: `p-vendor-${user.id}-1` },
    update: {},
    create: {
      id: `p-vendor-${user.id}-1`,
      userId: user.id,
      fromAccountId: account.id,
      amountPence: GBP(38.99),
      description: "PayPal purchase",
      isExternal: true,
      status: "PENDING_OTP",
      otpCode: "654321",
      ...({
        method: "VENDOR",
        vendor: "PAYPAL",
        vendorHandle: "buyer@example.com",
      } as any),
    },
  });

  console.log("New seed added without touching existing data:", {
    user: user.email,
    account: account.number,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

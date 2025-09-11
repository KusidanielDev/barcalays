// FILE: prisma/seed-new.cjs
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();
const GBP = (pounds) => Math.round(pounds * 100);

async function main() {
  const passHash = await hash("Password123!", 10);

  // admin (idempotent)
  await prisma.user.upsert({
    where: { email: "admin@demo.bank" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@demo.bank",
      passwordHash: passHash,
      role: "ADMIN",
      fullName: "Demo Admin",
      approved: true,
      status: "APPROVED",
    },
  });

  // user (idempotent)
  const user = await prisma.user.upsert({
    where: { email: "user@demo.bank" },
    update: {},
    create: {
      email: "user@demo.bank",
      passwordHash: passHash,
      role: "USER",
      fullName: "Demo User",
      approved: true,
      status: "APPROVED",
    },
  });

  // account (new number so it won't collide)
  const account = await prisma.account.upsert({
    where: { number: "20020001" },
    update: {
      userId: user.id,
      name: "Main",
      currency: "GBP",
      balance: GBP(1250),
      status: "OPEN",
      type: "CURRENT",
    },
    create: {
      userId: user.id,
      name: "Main",
      number: "20020001",
      currency: "GBP",
      balance: GBP(1250),
      sortCode: "12-34-56",
      status: "OPEN",
      type: "CURRENT",
    },
  });

  const now = new Date();
  await prisma.transaction.createMany({
    data: [
      {
        accountId: account.id,
        postedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
        description: "Groceries",
        amount: -GBP(42.73),
        balanceAfter: GBP(1207.27),
        status: "POSTED",
      },
      {
        accountId: account.id,
        postedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        description: "Ride share",
        amount: -GBP(12),
        balanceAfter: GBP(1195.27),
        status: "PENDING",
        adminMessage: "Merchant batch not settled",
      },
      {
        accountId: account.id,
        postedAt: new Date(now.getTime() - 1000 * 60 * 30),
        description: "Refund from store",
        amount: GBP(15),
        balanceAfter: GBP(1210.27),
        status: "REVERSED",
        adminMessage: "Reversed due to duplicate",
      },
    ],
  });

  await prisma.recurringIncome.upsert({
    where: { id: `ri-${user.id}-main` },
    update: {
      userId: user.id,
      accountId: account.id,
      name: "Monthly Salary",
      amountPence: GBP(1800),
      interval: "MONTHLY",
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
      active: true,
    },
    create: {
      id: `ri-${user.id}-main`,
      userId: user.id,
      accountId: account.id,
      name: "Monthly Salary",
      amountPence: GBP(1800),
      interval: "MONTHLY",
      nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 2),
      active: true,
    },
  });

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

  await prisma.payment.upsert({
    where: { id: `p-bank-${user.id}-1` },
    update: {},
    create: {
      id: `p-bank-${user.id}-1`,
      userId: user.id,
      fromAccountId: account.id,
      payeeId: payee.id,
      amountPence: GBP(550),
      description: "Rent payment",
      isExternal: true,
      status: "PENDING_OTP",
      otpCode: "123456",
      method: "BANK",
    },
  });

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
      method: "VENDOR",
      vendor: "PAYPAL",
      vendorHandle: "buyer@example.com",
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

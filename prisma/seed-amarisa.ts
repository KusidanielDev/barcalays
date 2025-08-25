// prisma/seed-amarisa.ts
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const GBP = (pounds: number) => Math.round(pounds * 100);
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  const email = "amarisaaryee963@gmail.com";
  const name = "Amarisa Aryee";
  const password = "Amarisa007";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash } as any, // ok if your schema lacks passwordHash
  });

  // Helper: consistent default sort code for required field
  const SC = "12-34-56";

  const savings = await prisma.account.upsert({
    where: { number: "SAV-AR-0001" },
    update: {
      userId: user.id,
      balance: GBP(10_000),
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      // sortCode not required in update payload
    },
    create: {
      userId: user.id,
      number: "SAV-AR-0001",
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(10_000),
      sortCode: SC, // <-- REQUIRED
    },
  });

  const investEM = await prisma.account.upsert({
    where: { number: "INV-AR-EM-0001" },
    update: {
      userId: user.id,
      balance: GBP(20_000),
      name: "Investment Account EM Ltd",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
    },
    create: {
      userId: user.id,
      number: "INV-AR-EM-0001",
      name: "Investment Account EM Ltd",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(20_000),
      sortCode: SC, // <-- REQUIRED
    },
  });

  const investMain = await prisma.account.upsert({
    where: { number: "INV-AR-GEN-0001" },
    update: {
      userId: user.id,
      balance: 0,
      name: "General Investment (Informa PLC & ENM)",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
    },
    create: {
      userId: user.id,
      number: "INV-AR-GEN-0001",
      name: "General Investment (Informa PLC & ENM)",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
      balance: 0,
      sortCode: SC, // <-- REQUIRED
    },
  });

  const INF = await prisma.security.upsert({
    where: { symbol: "INF" },
    update: {},
    create: {
      symbol: "INF",
      name: "Informa PLC",
      currency: "GBP",
      kind: "EQUITY",
    },
  });
  const ENM = await prisma.security.upsert({
    where: { symbol: "ENM" },
    update: {},
    create: { symbol: "ENM", name: "ENM", currency: "GBP", kind: "EQUITY" },
  });

  const t = Date.now();
  const base: Record<string, number> = { INF: 8.5, ENM: 9.1 };
  const priceFor = (sym: string) => {
    const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
    const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
    const px = (base[sym] ?? 100) + wave + micro;
    return Math.max(0.5, px);
  };
  const infPxP = GBP(priceFor("INF"));
  const enmPxP = GBP(priceFor("ENM"));

  const portfolioTotal = 1_360_000 - 10_000 - 20_000; // 1,330,000
  const INFalloc = 800_000;
  const ENMalloc = portfolioTotal - INFalloc; // 530,000
  const infQty = new Prisma.Decimal(Math.floor(GBP(INFalloc) / infPxP));
  const enmQty = new Prisma.Decimal(Math.floor(GBP(ENMalloc) / enmPxP));

  await prisma.holding.upsert({
    where: {
      accountId_securityId: { accountId: investMain.id, securityId: INF.id },
    },
    update: { quantity: infQty, avgCostP: infPxP },
    create: {
      accountId: investMain.id,
      securityId: INF.id,
      quantity: infQty,
      avgCostP: infPxP,
    },
  });
  await prisma.holding.upsert({
    where: {
      accountId_securityId: { accountId: investMain.id, securityId: ENM.id },
    },
    update: { quantity: enmQty, avgCostP: enmPxP },
    create: {
      accountId: investMain.id,
      securityId: ENM.id,
      quantity: enmQty,
      avgCostP: enmPxP,
    },
  });

  const incomeRows = [
    {
      accountId: investMain.id,
      amount: GBP(80_000),
      description: "Monthly returns",
    },
    { accountId: investMain.id, amount: GBP(5_000), description: "Dividends" },
  ];
  for (const m of [2, 1, 0]) {
    const postedAt = monthsAgo(m);
    postedAt.setDate(7);
    postedAt.setHours(9, 0, 0, 0);
    for (const row of incomeRows) {
      await prisma.transaction.create({
        data: {
          accountId: row.accountId,
          postedAt,
          description: row.description,
          amount: row.amount,
          balanceAfter: 0,
        },
      });
    }
  }

  const jan7 = new Date("2025-01-07T09:00:00.000Z");
  await prisma.transaction.create({
    data: {
      accountId: savings.id,
      postedAt: jan7,
      description: "Opening balance",
      amount: GBP(10_000),
      balanceAfter: GBP(10_000),
    },
  });
  await prisma.transaction.create({
    data: {
      accountId: investEM.id,
      postedAt: jan7,
      description: "Opening balance",
      amount: GBP(20_000),
      balanceAfter: GBP(20_000),
    },
  });

  console.log("Seed complete for", email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

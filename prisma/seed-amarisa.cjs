// FILE: prisma/seed-amarisa.cjs
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ---------- Config ----------
const GBP = (pounds) => Math.round(pounds * 100);
const AS_OF_TOTAL = 1_360_000; // As of 7 Jan 2025
const SAVINGS_CASH = 10_000; // Savings Account cash
const INVEST_EM_CASH = 20_000; // Investment Account EM Ltd cash
const INVEST_MAIN_CASH = 10_000; // Cash buffer for General Investment
const INF_TARGET = 800_000; // Target allocation for INF (rest ENM)
const SORT_CODE = "12-34-56";

function monthsBetweenInclusive(
  startYear,
  startMonthIdx,
  endYear,
  endMonthIdx
) {
  // monthIdx is 0-based (0=Jan)
  const out = [];
  let y = startYear,
    m = startMonthIdx;
  while (y < endYear || (y === endYear && m <= endMonthIdx)) {
    out.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return out;
}

async function main() {
  const email = "amarisaaryee963@gmail.com";
  const name = "Amarisa Aryee";
  const password = "Amarisa007";
  const passwordHash = await bcrypt.hash(password, 10);

  // User
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  });

  // Accounts
  const savings = await prisma.account.upsert({
    where: { number: "SAV-AR-0001" },
    update: {
      userId: user.id,
      balance: GBP(SAVINGS_CASH),
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
    },
    create: {
      userId: user.id,
      number: "SAV-AR-0001",
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(SAVINGS_CASH),
      sortCode: SORT_CODE,
    },
  });

  const investEM = await prisma.account.upsert({
    where: { number: "INV-AR-EM-0001" },
    update: {
      userId: user.id,
      balance: GBP(INVEST_EM_CASH),
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
      balance: GBP(INVEST_EM_CASH),
      sortCode: SORT_CODE,
    },
  });

  const investMain = await prisma.account.upsert({
    where: { number: "INV-AR-GEN-0001" },
    update: {
      userId: user.id,
      balance: GBP(INVEST_MAIN_CASH),
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
      balance: GBP(INVEST_MAIN_CASH),
      sortCode: SORT_CODE,
    },
  });

  // Securities
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

  // Simple price helper
  const t = Date.now();
  const BASE = { INF: 8.5, ENM: 9.1 };
  const priceFor = (sym) => {
    const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
    const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
    const px = (BASE[sym] ?? 100) + wave + micro;
    return Math.max(0.5, px);
  };
  const infPxP = GBP(priceFor("INF"));
  const enmPxP = GBP(priceFor("ENM"));

  // Holdings total = Total - cash
  const holdingsTotal =
    AS_OF_TOTAL - SAVINGS_CASH - INVEST_EM_CASH - INVEST_MAIN_CASH; // 1,320,000

  const INFalloc = INF_TARGET; // 800,000
  const ENMalloc = holdingsTotal - INFalloc; // 520,000

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

  // Opening balance transactions dated 7 Jan 2025 (visible & neat)
  const jan7 = new Date(Date.UTC(2025, 0, 7, 9, 0, 0)); // 7 Jan 2025 09:00 UTC
  await prisma.transaction.create({
    data: {
      accountId: savings.id,
      postedAt: jan7,
      description: "Opening balance",
      amount: GBP(SAVINGS_CASH),
      balanceAfter: GBP(SAVINGS_CASH),
    },
  });
  await prisma.transaction.create({
    data: {
      accountId: investEM.id,
      postedAt: jan7,
      description: "Opening balance",
      amount: GBP(INVEST_EM_CASH),
      balanceAfter: GBP(INVEST_EM_CASH),
    },
  });
  await prisma.transaction.create({
    data: {
      accountId: investMain.id,
      postedAt: jan7,
      description: "Opening balance (cash buffer)",
      amount: GBP(INVEST_MAIN_CASH),
      balanceAfter: GBP(INVEST_MAIN_CASH),
    },
  });

  // Monthly income rows from January 2025 → current month (7th at 09:00)
  const now = new Date();
  const months = monthsBetweenInclusive(
    2025,
    0,
    now.getFullYear(),
    now.getMonth()
  );
  for (const { year, month } of months) {
    const postedAt = new Date(Date.UTC(year, month, 7, 9, 0, 0));
    await prisma.transaction.create({
      data: {
        accountId: investMain.id,
        postedAt,
        description: "Monthly returns",
        amount: GBP(80_000),
        balanceAfter: 0,
      },
    });
    await prisma.transaction.create({
      data: {
        accountId: investMain.id,
        postedAt,
        description: "Dividends",
        amount: GBP(5_000),
        balanceAfter: 0,
      },
    });
  }

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

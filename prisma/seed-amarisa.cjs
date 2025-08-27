// FILE: prisma/seed-amarisa.cjs
/* Run with: node prisma/seed-amarisa.cjs */
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const GBP = (pounds) => Math.round(pounds * 100);

/** ---------- Price anchors (match your app) ---------- */
const BASE = {
  AAPL: 189.12,
  TSLA: 239.55,
  VUSA: 77.32,
  LGEN: 2.45,
  HSBA: 6.9,
  MSFT: 430.25,
  AMZN: 171.16,
  NVDA: 122.55,
  GOOGL: 168.38,
  META: 517.57,
  BP: 4.85,
  SHEL: 28.72,
  BARC: 1.45,
  RIO: 56.12,
  VOD: 0.72,
  INF: 8.5,
  ENM: 9.1,
};
function priceFor(sym, t) {
  const base = BASE[sym] ?? 100;
  const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
  const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
  return Math.max(0.5, base + wave + micro);
}

/** ---------- Helpers ---------- */
function monthsFromJanToNow() {
  const out = [];
  const now = new Date();
  for (let m = 0; ; m++) {
    const d = new Date(Date.UTC(2025, m, 7, 10, 0, 0)); // 7th each month
    if (d > now) break;
    out.push(d);
  }
  if (!out.length) throw new Error("No months from Jan 2025 to now.");
  return out;
}
const lerp = (a, b, t) => a + (b - a) * t;

async function main() {
  const email = "amarisaaryee963@gmail.com";
  const name = "Amarisa Aryee";
  const rawPassword = "Amarisa007";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // USER
  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name, passwordHash },
  });

  // SECURITIES
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

  // Ensure only THREE accounts exist for this user
  const keepNumbers = ["SAV-AR-0001", "INV-AR-EM-0001", "INV-AR-GEN-0001"];
  const existing = await prisma.account.findMany({
    where: { userId: user.id },
  });
  for (const a of existing) {
    if (!keepNumbers.includes(a.number)) {
      // delete dependents then the account
      await prisma.holding.deleteMany({ where: { accountId: a.id } });
      await prisma.transaction.deleteMany({ where: { accountId: a.id } });
      await prisma.investOrder.deleteMany({ where: { accountId: a.id } });
      await prisma.investCashTxn.deleteMany({ where: { accountId: a.id } });
      await prisma.account.delete({ where: { id: a.id } });
    }
  }

  // ACCOUNTS (set balances directly; no “opening balance” txns)
  const savings = await prisma.account.upsert({
    where: { number: "SAV-AR-0001" },
    update: {
      userId: user.id,
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(10_000),
    },
    create: {
      userId: user.id,
      sortCode: "20-00-00",
      number: "SAV-AR-0001",
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(10_000),
    },
  });

  const investEM = await prisma.account.upsert({
    where: { number: "INV-AR-EM-0001" },
    update: {
      userId: user.id,
      name: "Investment Account EM Ltd",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
    },
    create: {
      userId: user.id,
      sortCode: "20-00-00",
      number: "INV-AR-EM-0001",
      name: "Investment Account EM Ltd",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
      balance: 0,
    },
  });

  const investMain = await prisma.account.upsert({
    where: { number: "INV-AR-GEN-0001" },
    update: {
      userId: user.id,
      name: "General Investment (Informa PLC & ENM)",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
    },
    create: {
      userId: user.id,
      sortCode: "20-00-00",
      number: "INV-AR-GEN-0001",
      name: "General Investment (Informa PLC & ENM)",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
      balance: 0,
    },
  });

  // Clear prior activity on the 3 accounts (idempotent seeding)
  await prisma.holding.deleteMany({
    where: { accountId: { in: [investMain.id, investEM.id] } },
  });
  await prisma.transaction.deleteMany({
    where: { accountId: { in: [savings.id, investMain.id, investEM.id] } },
  });
  await prisma.investOrder.deleteMany({
    where: { accountId: { in: [investMain.id, investEM.id] } },
  });
  await prisma.investCashTxn.deleteMany({
    where: { accountId: { in: [investMain.id, investEM.id] } },
  });

  // =========================
  // GENERAL INVESTMENT TARGETS
  // =========================
  const totalTargetGBP = 1_415_896; // EXACT total that the card must show
  const totalTargetP = GBP(totalTargetGBP);

  // Choose a sensible cash remainder so history looks “green and steady”
  // (e.g., ~£70k cash; the rest as holdings MV)
  const todayT = Date.now();
  const pxINF = GBP(priceFor("INF", todayT));
  const pxENM = GBP(priceFor("ENM", todayT));

  // Aim ~95% in holdings, 5% cash (we'll correct precisely below)
  const holdAimP = Math.round(totalTargetP * 0.95);
  const infAllocP = Math.round(holdAimP * 0.6);
  const enmAllocP = holdAimP - infAllocP;

  // Quantities sized on today's prices
  const infQty = Math.max(1, Math.floor(infAllocP / pxINF));
  const enmQty = Math.max(1, Math.floor(enmAllocP / pxENM));

  // Force a green P/L: set avg cost slightly below today's (~97% of today's price)
  const avgINF = Math.floor(pxINF * 0.97);
  const avgENM = Math.floor(pxENM * 0.97);

  // Upsert holdings (no huge buy txns — history stays clean)
  await prisma.holding.upsert({
    where: {
      accountId_securityId: { accountId: investMain.id, securityId: INF.id },
    },
    update: { quantity: new Prisma.Decimal(infQty), avgCostP: avgINF },
    create: {
      accountId: investMain.id,
      securityId: INF.id,
      quantity: new Prisma.Decimal(infQty),
      avgCostP: avgINF,
    },
  });
  await prisma.holding.upsert({
    where: {
      accountId_securityId: { accountId: investMain.id, securityId: ENM.id },
    },
    update: { quantity: new Prisma.Decimal(enmQty), avgCostP: avgENM },
    create: {
      accountId: investMain.id,
      securityId: ENM.id,
      quantity: new Prisma.Decimal(enmQty),
      avgCostP: avgENM,
    },
  });

  // Compute MV with today's price anchors
  const mvGeneral = infQty * pxINF + enmQty * pxENM;
  const cashTargetGeneral = totalTargetP - mvGeneral;

  // =========================
  // MONTHLY RETURNS / DIVIDENDS (Jan -> now)
  // =========================
  // Latest month MUST be 86,845 and 5,142; earlier months ramp up smoothly.
  const months = monthsFromJanToNow();
  const N = months.length;
  const LAST = N - 1;

  const returnsP = Array(N).fill(0);
  const divsP = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const t = N === 1 ? 1 : i / (N - 1);
    const r = i === LAST ? 86845 : Math.round(lerp(35000, 85000, t)); // steady rising
    const d = i === LAST ? 5142 : Math.round(lerp(2800, 5000, t));
    returnsP[i] = GBP(r);
    divsP[i] = GBP(d);
  }

  // Sum credits; ensure the final CASH equals cashTargetGeneral WITHOUT any extra “adjust” row.
  // We’ll add a small correction into the FIRST month’s returns so the last month stays exact.
  const sumBaseCredits = returnsP.reduce((s, v, i) => s + v + divsP[i], 0);

  const delta = cashTargetGeneral - sumBaseCredits;
  // Fold correction into the first month’s returns (keeps history simple, last month exact)
  returnsP[0] += delta;

  // Write transactions (NO buy debits for General — keeps the feed clean & green)
  let runningCash = 0;
  for (let i = 0; i < N; i++) {
    if (returnsP[i]) {
      await prisma.transaction.create({
        data: {
          accountId: investMain.id,
          postedAt: months[i],
          description: "Monthly returns",
          amount: returnsP[i],
          balanceAfter: (runningCash += returnsP[i]),
        },
      });
    }
    if (divsP[i]) {
      await prisma.transaction.create({
        data: {
          accountId: investMain.id,
          postedAt: months[i],
          description: "Dividends",
          amount: divsP[i],
          balanceAfter: (runningCash += divsP[i]),
        },
      });
    }
  }

  // Finally set General Investment CASH to match the target precisely
  await prisma.account.update({
    where: { id: investMain.id },
    data: { balance: cashTargetGeneral, status: "OPEN" },
  });

  // =========================
  // EM LTD: tiny holding but TOTAL must be exactly £20,000
  // =========================
  // Give it a very small INF holding, and set cash so cash + MV == 20,000
  const emTinyQty = 25; // tiny holding
  const emPxToday = pxINF; // same INF price anchor
  const emMV = emTinyQty * emPxToday;
  const emTotalTargetP = GBP(20_000);
  const emCash = emTotalTargetP - emMV;

  await prisma.holding.upsert({
    where: {
      accountId_securityId: { accountId: investEM.id, securityId: INF.id },
    },
    update: {
      quantity: new Prisma.Decimal(emTinyQty),
      avgCostP: Math.floor(pxINF * 0.97),
    },
    create: {
      accountId: investEM.id,
      securityId: INF.id,
      quantity: new Prisma.Decimal(emTinyQty),
      avgCostP: Math.floor(pxINF * 0.97),
    },
  });
  await prisma.account.update({
    where: { id: investEM.id },
    data: { balance: emCash, status: "OPEN" },
  });

  // =========================
  // SAVINGS: exactly £10,000 cash (no txns required)
  // =========================
  await prisma.account.update({
    where: { id: savings.id },
    data: { balance: GBP(10_000), status: "OPEN" },
  });

  console.log(
    "Seed complete: 3 accounts only; Savings £10,000; EM Ltd £20,000 total; General £1,415,896 total; latest returns £86,845 & dividends £5,142."
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

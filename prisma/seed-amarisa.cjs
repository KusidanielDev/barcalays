// FILE: prisma/seed-amarisa.cjs
/* Run with: node prisma/seed-amarisa.cjs */
const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const GBP = (pounds) => Math.round(pounds * 100);

/** ---------- Price anchors (match your server/UI) ---------- */
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
const fee = (notionalP) => Math.max(100, Math.round(notionalP * 0.001)); // £1 or 0.1%
const lerp = (a, b, t) => a + (b - a) * t;

async function main() {
  // --- USER ---
  const email = "amarisaaryee963@gmail.com";
  const name = "Amarisa Aryee";
  const rawPassword = "Amarisa007";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name, passwordHash },
  });

  // --- ACCOUNTS (no opening txns; we set balances directly) ---
  const savings = await prisma.account.upsert({
    where: { number: "SAV-AR-0001" },
    update: {
      userId: user.id,
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(120_000), // bump to lift net worth into 1.5–1.6M
    },
    create: {
      userId: user.id,
      sortCode: "20-00-00",
      number: "SAV-AR-0001",
      name: "Savings Account",
      type: "SAVINGS",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(120_000),
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
      balance: GBP(20_000),
    },
    create: {
      userId: user.id,
      sortCode: "20-00-00",
      number: "INV-AR-EM-0001",
      name: "Investment Account EM Ltd",
      type: "INVESTMENT",
      currency: "GBP",
      status: "OPEN",
      balance: GBP(20_000),
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

  // --- SECURITIES ---
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

  // Clear past data so this is idempotent for these accounts
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
  // GENERAL INVESTMENT PLAN
  // =========================
  // EXACT total (cash + MV) target:
  const totalTargetGBP = 1_415_896;
  const totalTargetP = GBP(totalTargetGBP);

  const months = monthsFromJanToNow();
  const N = months.length;
  const LAST = N - 1;

  // Gradual growth: start modest and ramp up to your exact latest values
  const returnsP = Array(N).fill(0);
  const divsP = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const t = N === 1 ? 1 : i / (N - 1);
    const r = i === LAST ? 86845 : Math.round(lerp(35000, 85000, t)); // ramp to just under 86,845
    const d = i === LAST ? 5142 : Math.round(lerp(2800, 5000, t)); // ramp to just under 5,142
    returnsP[i] = GBP(r);
    divsP[i] = GBP(d);
  }

  // Invest monthly on the 10th: ~70% of available cash; split 60/40 INF/ENM.
  let runningCash = 0;
  const exec = {
    INF: { qty: 0, notionalP: 0, feesP: 0 },
    ENM: { qty: 0, notionalP: 0, feesP: 0 },
  };

  for (let i = 0; i < N; i++) {
    const creditDate = months[i];
    const buyDate = new Date(
      Date.UTC(
        creditDate.getUTCFullYear(),
        creditDate.getUTCMonth(),
        10,
        11,
        0,
        0
      )
    );

    // Credits on 7th
    if (returnsP[i]) {
      await prisma.transaction.create({
        data: {
          accountId: investMain.id,
          postedAt: creditDate,
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
          postedAt: creditDate,
          description: "Dividends",
          amount: divsP[i],
          balanceAfter: (runningCash += divsP[i]),
        },
      });
    }

    // Buys on 10th (only if in past)
    if (buyDate <= new Date() && runningCash > GBP(5_000)) {
      const investable = Math.floor(runningCash * 0.7);
      const partINF = Math.floor(investable * 0.6);
      const partENM = investable - partINF;

      const pxINF = GBP(priceFor("INF", buyDate.getTime()));
      const pxENM = GBP(priceFor("ENM", buyDate.getTime()));

      // INF
      if (partINF > 0) {
        const feeINF = fee(partINF);
        const qtyINF = Math.floor((partINF - feeINF) / pxINF);
        const spendINF = qtyINF * pxINF + feeINF;
        if (qtyINF > 0 && spendINF <= runningCash) {
          await prisma.transaction.create({
            data: {
              accountId: investMain.id,
              postedAt: buyDate,
              description: `BUY INF x ${qtyINF} @ £${(pxINF / 100).toFixed(2)}`,
              amount: -spendINF,
              balanceAfter: (runningCash -= spendINF),
            },
          });
          exec.INF.qty += qtyINF;
          exec.INF.notionalP += qtyINF * pxINF;
          exec.INF.feesP += feeINF;
        }
      }

      // ENM
      if (partENM > 0) {
        const feeENM = fee(partENM);
        const qtyENM = Math.floor((partENM - feeENM) / pxENM);
        const spendENM = qtyENM * pxENM + feeENM;
        if (qtyENM > 0 && spendENM <= runningCash) {
          await prisma.transaction.create({
            data: {
              accountId: investMain.id,
              postedAt: buyDate,
              description: `BUY ENM x ${qtyENM} @ £${(pxENM / 100).toFixed(2)}`,
              amount: -spendENM,
              balanceAfter: (runningCash -= spendENM),
            },
          });
          exec.ENM.qty += qtyENM;
          exec.ENM.notionalP += qtyENM * pxENM;
          exec.ENM.feesP += feeENM;
        }
      }
    }
  }

  // HOLDINGS: weighted avg costs; ensure P/L green (avg < today’s px if needed)
  const nowT = Date.now();
  const todayPxINF = GBP(priceFor("INF", nowT));
  const todayPxENM = GBP(priceFor("ENM", nowT));

  const holdings = [];
  if (exec.INF.qty > 0) {
    let avgINF = Math.round(exec.INF.notionalP / (exec.INF.qty || 1));
    if (todayPxINF <= avgINF) avgINF = Math.floor(avgINF * 0.97);
    holdings.push({ sec: INF, qty: exec.INF.qty, avgP: avgINF });
  }
  if (exec.ENM.qty > 0) {
    let avgENM = Math.round(exec.ENM.notionalP / (exec.ENM.qty || 1));
    if (todayPxENM <= avgENM) avgENM = Math.floor(avgENM * 0.97);
    holdings.push({ sec: ENM, qty: exec.ENM.qty, avgP: avgENM });
  }

  // Upsert holdings
  for (const h of holdings) {
    await prisma.holding.upsert({
      where: {
        accountId_securityId: {
          accountId: investMain.id,
          securityId: h.sec.id,
        },
      },
      update: { quantity: new Prisma.Decimal(h.qty), avgCostP: h.avgP },
      create: {
        accountId: investMain.id,
        securityId: h.sec.id,
        quantity: new Prisma.Decimal(h.qty),
        avgCostP: h.avgP,
      },
    });
  }

  // Compute MV with today's px
  const mv =
    (holdings.find((h) => h.sec.id === INF.id)?.qty || 0) * todayPxINF +
    (holdings.find((h) => h.sec.id === ENM.id)?.qty || 0) * todayPxENM;

  // We want: cash + MV == totalTargetP  → set cash to that
  let desiredCash = totalTargetP - mv;

  // Our runningCash is what the transaction history produced. Adjust prior month returns slightly (one line)
  // so that the FINAL cash equals desiredCash, while keeping the latest month EXACT (86,845 / 5,142).
  const delta = desiredCash - runningCash;
  if (delta !== 0) {
    const adjMonth = Math.max(0, LAST - 1); // adjust the month before the latest, so latest stays exact
    const when = new Date(months[adjMonth].getTime() + 60 * 60 * 1000); // +1h same day
    await prisma.transaction.create({
      data: {
        accountId: investMain.id,
        postedAt: when,
        description: "Monthly returns",
        amount: delta,
        balanceAfter: (runningCash += delta),
      },
    });
  }

  // Update cash on account
  await prisma.account.update({
    where: { id: investMain.id },
    data: { balance: runningCash, status: "OPEN" },
  });

  // ======================
  // EM LTD: tiny holding + £20k cash
  // ======================
  const emQty = new Prisma.Decimal(75);
  const emPx = GBP(priceFor("INF", Date.UTC(2025, 1, 15, 10, 0, 0)));
  await prisma.holding.upsert({
    where: {
      accountId_securityId: { accountId: investEM.id, securityId: INF.id },
    },
    update: { quantity: emQty, avgCostP: emPx },
    create: {
      accountId: investEM.id,
      securityId: INF.id,
      quantity: emQty,
      avgCostP: emPx,
    },
  });
  await prisma.account.update({
    where: { id: investEM.id },
    data: { balance: GBP(20_000), status: "OPEN" },
  });

  console.log(
    "Seed complete: General total = £1,415,896, latest returns £86,845 & dividends £5,142, net worth ≈ £1.556M, green P/L."
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

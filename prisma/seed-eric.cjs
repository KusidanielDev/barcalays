// FILE: prisma/seed-eric.cjs
/* Seed Eric: one GBP account with final balance £171,000.00 (17,100,000 pence),
   older transactions (>= 4 months ago) that sum EXACTLY to that final balance,
   and exactly two *recent* transactions today in São Paulo (Brazil) time:
     - 10:00: GRU overstay fine (ERROR) — no funds deducted
     - now:   Wise payment to @kristib125 (PENDING) — no funds deducted
   Account balance remains 17,100,000 pence.
   Idempotent: uses fixed IDs for upsert so re-running won’t duplicate rows. */

const { PrismaClient } = require("@prisma/client");
const { hashSync } = require("bcryptjs");
const prisma = new PrismaClient();

// ------------ helpers ------------
const GBP = (pounds) => Math.round(pounds * 100);
const TZ_BR = "America/Sao_Paulo";

// Build a Date representing "the local time in TZ_BR", converted to a UTC instant
function partsNow(timeZone) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  );
}
function zonedDate(timeZone, y, m, d, hh = "00", mm = "00", ss = "00") {
  // Interpret given parts as local wall-clock in `timeZone`, then create the same *clock*
  // time as a UTC Date. Good enough for seed realism.
  return new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
}
function brNow() {
  const p = partsNow(TZ_BR);
  return zonedDate(TZ_BR, p.year, p.month, p.day, p.hour, p.minute, p.second);
}
function brTodayAt(hh, mm = 0, ss = 0) {
  const p = partsNow(TZ_BR);
  return zonedDate(
    TZ_BR,
    p.year,
    p.month,
    p.day,
    String(hh).padStart(2, "0"),
    String(mm).padStart(2, "0"),
    String(ss).padStart(2, "0")
  );
}

// ------------ constants ------------
const FINAL_BAL_P = 17_100_000; // £171,000.00 (pence)
const GRU_FINE_P = 126_400; // £1,264.00 (USD 1,580 approx)
const WISE_P_GBP = 40_000; // £400.00 (~$500)
const GRU_10AM_BR = brTodayAt(10, 0, 0); // 10:00 today in São Paulo
const WISE_NOW_BR = brNow(); // now in São Paulo

// Older posted transactions (>= 4 months ago) engineered to end at 17,100,000 pence.
// (All dates are older than ~4 months from today.)
const OLDER_TX = [
  // Two years ago
  {
    id: "tx_eric_2023_12_salary_100k",
    postedAt: new Date("2023-12-15T09:00:00.000Z"),
    description: "Salary deposit — Dec 2023",
    amount: GBP(100_000), // +£100,000.00
  },
  // Last year
  {
    id: "tx_eric_2024_05_invest_proceeds_55k",
    postedAt: new Date("2024-05-10T09:00:00.000Z"),
    description: "Investment proceeds — May 2024",
    amount: GBP(55_000), // +£55,000.00
  },
  {
    id: "tx_eric_2024_08_flight_minus_1900",
    postedAt: new Date("2024-08-10T11:30:00.000Z"),
    description: "Flight purchase — holiday",
    amount: -GBP(1_900), // -£1,900.00
  },
  {
    id: "tx_eric_2024_11_bonus_12k",
    postedAt: new Date("2024-11-15T09:00:00.000Z"),
    description: "Bonus — Nov 2024",
    amount: GBP(12_000), // +£12,000.00
  },
  {
    id: "tx_eric_2024_12_topup_8900",
    postedAt: new Date("2024-12-27T10:00:00.000Z"),
    description: "Savings top-up — Dec 2024",
    amount: GBP(8_900), // +£8,900.00
  },
  // This year (older than 4 months)
  {
    id: "tx_eric_2025_03_bills_minus_3000",
    postedAt: new Date("2025-03-20T10:00:00.000Z"),
    description: "Utilities & council tax — Mar 2025",
    amount: -GBP(3_000), // -£3,000.00
  },
];
// Check sum (for reference): 100000 + 55000 - 1900 + 12000 + 8900 - 3000 = 171000

async function main() {
  // 1) Eric user (login)
  const email = "eric541s@gmail.com";
  const passwordHash = hashSync("eric1", 10); // bcrypt hash at seed time

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "Eric",
      name: "Eric",
      status: "APPROVED",
      approved: true,
      role: "USER",
      passwordHash, // keep updated on re-run
    },
    create: {
      email,
      fullName: "Eric",
      name: "Eric",
      passwordHash,
      role: "USER",
      approved: true,
      status: "APPROVED",
    },
  });

  // 2) One GBP account (OPEN). Your schema requires sortCode.
  const account = await prisma.account.upsert({
    where: { number: "ER-171000-GBP" },
    update: {
      userId: user.id,
      name: "Eric Main",
      type: "CURRENT",
      currency: "GBP",
      status: "OPEN",
      sortCode: "12-34-56",
      balance: FINAL_BAL_P,
    },
    create: {
      userId: user.id,
      name: "Eric Main",
      type: "CURRENT",
      number: "ER-171000-GBP",
      sortCode: "12-34-56",
      currency: "GBP",
      status: "OPEN",
      balance: FINAL_BAL_P,
    },
  });

  // 3) GRU payee for the bank fine
  const gruPayee = await prisma.payee.upsert({
    where: { id: "payee_eric_gru_fedpol" },
    update: {
      userId: user.id,
      name: "Brazil Federal Police – GRU Immigration",
      sortCode: "12-34-56",
      accountNumber: "87654321",
      reference: "Passport G1234567 · Overstay",
    },
    create: {
      id: "payee_eric_gru_fedpol",
      userId: user.id,
      name: "Brazil Federal Police – GRU Immigration",
      sortCode: "12-34-56",
      accountNumber: "87654321",
      reference: "Passport G1234567 · Overstay",
    },
  });

  // 4) Write older POSTED transactions with accurate running "balanceAfter"
  let running = 0;
  for (const t of OLDER_TX.sort((a, b) => a.postedAt - b.postedAt)) {
    running += t.amount;
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: {
        accountId: account.id,
        postedAt: t.postedAt,
        description: t.description,
        amount: t.amount,
        balanceAfter: running,
        status: "POSTED",
        adminMessage: null,
      },
      create: {
        id: t.id,
        accountId: account.id,
        postedAt: t.postedAt,
        description: t.description,
        amount: t.amount,
        balanceAfter: running,
        status: "POSTED",
        adminMessage: null,
      },
    });
  }
  if (running !== FINAL_BAL_P) {
    throw new Error(
      `Invariant failed: running=${running} but expected ${FINAL_BAL_P}`
    );
  }

  // 5) Recent #1 — GRU overstay fine at 10:00 today (São Paulo)
  // Transaction = ERROR (no deduction), balanceAfter stays at FINAL_BAL_P
  await prisma.transaction.upsert({
    where: { id: "tx_eric_2025_br_gru_10am" },
    update: {
      accountId: account.id,
      postedAt: GRU_10AM_BR,
      description:
        "IMMIGRATION OVERSTAY FINE – EXIT PROCESSING (GRU · São Paulo–Guarulhos, BR)",
      amount: -GRU_FINE_P,
      balanceAfter: FINAL_BAL_P, // error -> no funds deducted
      status: "ERROR",
      adminMessage: "Bank rejection: verification mismatch; no funds deducted.",
    },
    create: {
      id: "tx_eric_2025_br_gru_10am",
      accountId: account.id,
      postedAt: GRU_10AM_BR,
      description:
        "IMMIGRATION OVERSTAY FINE – EXIT PROCESSING (GRU · São Paulo–Guarulhos, BR)",
      amount: -GRU_FINE_P,
      balanceAfter: FINAL_BAL_P,
      status: "ERROR",
      adminMessage: "Bank rejection: verification mismatch; no funds deducted.",
    },
  });

  // Matching Payment row marked FAILED (BANK)
  await prisma.payment.upsert({
    where: { id: "pay_eric_br_gru_10am" },
    update: {
      userId: user.id,
      fromAccountId: account.id,
      payeeId: gruPayee.id,
      amountPence: GRU_FINE_P,
      description:
        "IMMIGRATION OVERSTAY FINE – EXIT PROCESSING (GRU · São Paulo–Guarulhos, BR)",
      isExternal: true,
      status: "FAILED",
      method: "BANK",
      otpCode: null,
      createdAt: GRU_10AM_BR,
    },
    create: {
      id: "pay_eric_br_gru_10am",
      userId: user.id,
      fromAccountId: account.id,
      payeeId: gruPayee.id,
      amountPence: GRU_FINE_P,
      description:
        "IMMIGRATION OVERSTAY FINE – EXIT PROCESSING (GRU · São Paulo–Guarulhos, BR)",
      isExternal: true,
      status: "FAILED",
      method: "BANK",
      otpCode: null,
      createdAt: GRU_10AM_BR,
    },
  });

  // 6) Recent #2 — Wise payment to Kristi Britt at *current São Paulo time*
  // Transaction = PENDING (no deduction), balanceAfter stays at FINAL_BAL_P
  await prisma.transaction.upsert({
    where: { id: "tx_eric_2025_br_wise_now" },
    update: {
      accountId: account.id,
      postedAt: WISE_NOW_BR,
      description: "WISE payment to Kristi Britt (@kristib125)",
      amount: -WISE_P_GBP,
      balanceAfter: FINAL_BAL_P, // pending -> no funds deducted yet
      status: "PENDING",
      adminMessage:
        "Requires customer assistance: recipient details verification in progress.",
    },
    create: {
      id: "tx_eric_2025_br_wise_now",
      accountId: account.id,
      postedAt: WISE_NOW_BR,
      description: "WISE payment to Kristi Britt (@kristib125)",
      amount: -WISE_P_GBP,
      balanceAfter: FINAL_BAL_P,
      status: "PENDING",
      adminMessage:
        "Requires customer assistance: recipient details verification in progress.",
    },
  });

  // Matching Payment row marked PENDING_OTP (VENDOR=WISE) — status enum requires this for "pending"
  await prisma.payment.upsert({
    where: { id: "pay_eric_br_wise_now" },
    update: {
      userId: user.id,
      fromAccountId: account.id,
      amountPence: WISE_P_GBP,
      description: "WISE payment to Kristi Britt (@kristib125) — approx $500",
      isExternal: true,
      status: "PENDING_OTP", // enum options: PENDING_OTP | COMPLETED | FAILED
      method: "VENDOR",
      vendor: "WISE",
      vendorHandle: "kristib125",
      // keep otpCode null or random; not shown to user
      otpCode: null,
      createdAt: WISE_NOW_BR,
    },
    create: {
      id: "pay_eric_br_wise_now",
      userId: user.id,
      fromAccountId: account.id,
      amountPence: WISE_P_GBP,
      description: "WISE payment to Kristi Britt (@kristib125) — approx $500",
      isExternal: true,
      status: "PENDING_OTP",
      method: "VENDOR",
      vendor: "WISE",
      vendorHandle: "kristib125",
      otpCode: null,
      createdAt: WISE_NOW_BR,
    },
  });

  // 7) Ensure account balance is exactly 17,100,000 (final)
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: FINAL_BAL_P },
  });

  console.log("Eric seeded:");
  console.log({
    login: { email, password: "eric1" },
    account: account.number,
    finalBalancePence: FINAL_BAL_P,
    finalBalanceGBP: (FINAL_BAL_P / 100).toFixed(2),
    gruFineAtBR: GRU_10AM_BR.toISOString(),
    wiseNowAtBR: WISE_NOW_BR.toISOString(),
  });
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

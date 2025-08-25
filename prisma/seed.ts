// FILE: prisma/seed.ts (snippet)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "demo_investor@barclays.local";
  const plain = "DemoInvestor123!";
  const passwordHash = await bcrypt.hash(plain, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash }, // keep in sync if re-seeding
    create: {
      email,
      passwordHash, // <- hashed password for Credentials login
      name: "Demo Investor",
      approved: true,
      status: "APPROVED",
    },
  });

  // Helper to create an investment account
  async function upsertAccount(
    name: string,
    number: string,
    balanceP = 2500000
  ) {
    return prisma.account.upsert({
      where: { number },
      update: {},
      create: {
        userId: user.id,
        name,
        number,
        sortCode: "23-45-67",
        type: "INVESTMENT", // keep your existing types; this just labels it
        balance: balanceP, // cash pence
        currency: "GBP",
        status: "OPEN",
      },
    });
  }

  const isa = await upsertAccount("Stocks & Shares ISA", "SI-000111");
  const gia = await upsertAccount(
    "General Investment Account",
    "GI-000222",
    1500000
  );
  const sipp = await upsertAccount("SIPP", "SP-000333", 5000000);

  // Securities
  const tickers = [
    { symbol: "AAPL", name: "Apple Inc.", currency: "USD" },
    { symbol: "TSLA", name: "Tesla, Inc.", currency: "USD" },
    { symbol: "VUSA", name: "Vanguard S&P 500 UCITS ETF", currency: "GBP" },
    { symbol: "LGEN", name: "Legal & General Group", currency: "GBP" },
    { symbol: "HSBA", name: "HSBC Holdings", currency: "GBP" },
  ];

  const secs = await Promise.all(
    tickers.map((t) =>
      prisma.security.upsert({
        where: { symbol: t.symbol },
        update: {},
        create: {
          symbol: t.symbol,
          name: t.name,
          currency: t.currency,
          kind: "EQUITY",
        },
      })
    )
  );

  // Seed holdings across accounts
  async function seedHolding(
    accountId: string,
    symbol: string,
    qty: number,
    avgPence: number
  ) {
    const sec = secs.find((s) => s.symbol === symbol)!;
    await prisma.holding.upsert({
      where: { accountId_securityId: { accountId, securityId: sec.id } },
      update: {
        quantity: qty.toFixed(8) as unknown as any,
        avgCostP: avgPence,
      },
      create: {
        accountId,
        securityId: sec.id,
        quantity: qty.toFixed(8) as unknown as any,
        avgCostP: avgPence,
      },
    });
  }

  await seedHolding(isa.id, "AAPL", 10, 22000); // £220.00 equiv
  await seedHolding(isa.id, "VUSA", 15, 7200);
  await seedHolding(gia.id, "TSLA", 5, 18000);
  await seedHolding(gia.id, "HSBA", 50, 620);
  await seedHolding(sipp.id, "LGEN", 100, 230);

  console.log("Seed complete for user:", email);
}

main().finally(() => prisma.$disconnect());

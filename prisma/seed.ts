import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function pence(n: number) { return Math.round(n * 100); }
function rndAcct() {
  const num = Math.floor(10_000_000 + Math.random()*89_999_999).toString();
  return `${num.slice(0,4)}${num.slice(4)}`;
}
function rndSortCode() {
  const n = () => String(Math.floor(Math.random()*90)+10);
  return `${n()}-${n()}-${n()}`;
}
async function main() {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.create({
    data: { name: "Alice Demo", email: "alice@example.com", passwordHash: pw, role: "USER" }
  });
  const bob = await prisma.user.create({
    data: { name: "Bob Admin", email: "bob@example.com", passwordHash: pw, role: "ADMIN" }
  });

  const aliceCA = await prisma.account.create({
    data: {
      userId: alice.id, name: "Barclays Bank Account", type: "Current",
      number: rndAcct(), sortCode: rndSortCode(), balance: pence(1234.56)
    }
  });
  const aliceSV = await prisma.account.create({
    data: {
      userId: alice.id, name: "Everyday Saver", type: "Savings",
      number: rndAcct(), sortCode: rndSortCode(), balance: pence(2500.00)
    }
  });

  // Add a few transactions to current account
  const txs = [
    { postedAt: new Date(Date.now()-86400*1000*1), description: "Grocery Mart", amount: -pence(24.80) },
    { postedAt: new Date(Date.now()-86400*1000*2), description: "Salary", amount:  pence(1500.00) },
    { postedAt: new Date(Date.now()-86400*1000*3), description: "Coffee Shop", amount: -pence(3.50) },
    { postedAt: new Date(Date.now()-86400*1000*4), description: "Electric Bill", amount: -pence(60.00) },
    { postedAt: new Date(Date.now()-86400*1000*5), description: "Mobile Top-up", amount: -pence(10.00) },
  ];
  let bal = aliceCA.balance;
  for (const t of txs.sort((a,b)=>a.postedAt.getTime()-b.postedAt.getTime())) {
    bal += t.amount;
    await prisma.transaction.create({
      data: { accountId: aliceCA.id, postedAt: t.postedAt, description: t.description, amount: t.amount, balanceAfter: bal }
    });
  }

  console.log("Seed complete. Users:");
  console.log("- alice@example.com / password123 (USER)");
  console.log("- bob@example.com   / password123 (ADMIN)");
}

main().finally(()=>prisma.$disconnect());

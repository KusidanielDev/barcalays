// FILE: prisma/withdraw-lorraine.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // keep lowercased to match your auth flow
  const email = "harmonlorraine363@gmail.com";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  // Find Lorraine's OPEN INR account
  const account = await prisma.account.findFirst({
    where: { userId: user.id, currency: "INR", status: "OPEN" },
    orderBy: { createdAt: "asc" },
  });
  if (!account) throw new Error(`No OPEN INR account for ${email}`);

  const balance = account.balance || 0; // paise
  if (balance <= 0) {
    console.log("Nothing to withdraw; balance already zero.", {
      accountId: account.id,
      balance,
    });
    return;
  }

  // Build 10:30 AM IST on the 18th as a UTC Date.
  // IST = UTC+5:30 -> 10:30 IST === 05:00 UTC.
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = 18;
  const tenThirtyIST_asUTC = new Date(Date.UTC(y, m, day, 5, 0, 0, 0));

  // Idempotency guard: if a full-balance withdrawal already exists at that timestamp, skip
  const existing = await prisma.transaction.findFirst({
    where: {
      accountId: account.id,
      postedAt: tenThirtyIST_asUTC,
      amount: -balance,
      description: "Cash withdrawal by account owner (10:30 Asia/Kolkata)",
    },
  });
  if (existing) {
    console.log("Withdrawal already exists; skipping.", { txnId: existing.id });
    return;
  }

  // Create the withdrawal (full balance out)
  await prisma.transaction.create({
    data: {
      accountId: account.id,
      postedAt: tenThirtyIST_asUTC,
      description: "Cash withdrawal by account owner (10:30 Asia/Kolkata)",
      amount: -balance, // debit full balance
      balanceAfter: 0,
    },
  });

  // Set account balance to zero
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: 0 },
  });

  console.log("Full withdrawal completed:", {
    user: email,
    accountId: account.id,
    withdrawn: `₹${(balance / 100).toFixed(2)}`,
    finalBalance: "₹0.00",
    postedAtUTC: tenThirtyIST_asUTC.toISOString(),
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

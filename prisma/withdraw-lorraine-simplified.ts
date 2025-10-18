// FILE: prisma/withdraw-lorraine-simplified.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Cleans up the previous 10:30 IST full-balance withdrawal (with verbose description),
 * restores the balance, and re-creates a clean "Cash withdrawal" at 10:30 AM IST on the 18th.
 *
 * End state:
 *   - A single transaction:
 *       description: "Cash withdrawal"
 *       postedAt: 10:30 IST on the 18th (stored as UTC)
 *       amount: -<full balance before withdrawal>
 *       balanceAfter: 0
 *   - Account balance: 0
 */
async function main() {
  const email = "harmonlorraine363@gmail.com"; // keep lowercased (matches your auth flow)

  // 1) Find user + INR OPEN account
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const account = await prisma.account.findFirst({
    where: { userId: user.id, currency: "INR", status: "OPEN" },
    orderBy: { createdAt: "asc" },
  });
  if (!account) throw new Error(`No OPEN INR account for ${email}`);

  // Build 10:30 AM IST on the 18th as UTC (IST = UTC+05:30 → 10:30 IST == 05:00 UTC)
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const day = 18;
  const tenThirtyIST_asUTC = new Date(Date.UTC(y, m, day, 5, 0, 0, 0));

  // 2) If our earlier verbose withdrawal exists, remove it and restore balance.
  //    We search both the long description we used earlier and a generic match on timestamp.
  const existingVerbose = await prisma.transaction.findFirst({
    where: {
      accountId: account.id,
      postedAt: tenThirtyIST_asUTC,
      description: "Cash withdrawal by account owner (10:30 Asia/Kolkata)",
    },
  });

  if (existingVerbose) {
    // Restore account balance by adding back the withdrawn amount (amount is negative)
    const restored = (account.balance || 0) + Math.abs(existingVerbose.amount);

    // Delete the old transaction
    await prisma.transaction.delete({ where: { id: existingVerbose.id } });

    // Update account balance back to what it was pre-withdrawal
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: restored },
    });

    // also update local reference for continued logic
    account.balance = restored;
  }

  // Guard: if someone manually created a generic withdrawal at the same timestamp, remove it too.
  const existingGeneric = await prisma.transaction.findFirst({
    where: {
      accountId: account.id,
      postedAt: tenThirtyIST_asUTC,
      description: "Cash withdrawal",
    },
  });
  if (existingGeneric) {
    // If it exists, rollback its effect as well (so we can re-apply cleanly)
    const restored = (account.balance || 0) + Math.abs(existingGeneric.amount);
    await prisma.transaction.delete({ where: { id: existingGeneric.id } });
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: restored },
    });
    account.balance = restored;
  }

  // 3) Re-create the clean, typical entry: withdraw FULL current balance
  const balanceBefore = account.balance || 0;
  if (balanceBefore <= 0) {
    console.log("Nothing to withdraw; balance already zero.", {
      accountId: account.id,
      balanceBefore,
    });
    return;
  }

  await prisma.transaction.create({
    data: {
      accountId: account.id,
      postedAt: tenThirtyIST_asUTC,
      description: "Cash withdrawal", // ← short, typical
      amount: -balanceBefore, // debit entire balance
      balanceAfter: 0,
    },
  });

  await prisma.account.update({
    where: { id: account.id },
    data: { balance: 0 },
  });

  console.log("Replaced withdrawal with clean entry:", {
    user: email,
    accountId: account.id,
    withdrawn: `₹${(balanceBefore / 100).toFixed(2)}`,
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

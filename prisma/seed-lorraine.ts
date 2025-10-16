// FILE: prisma/seed-lorraine.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Your requested data:
 *  - User:   Lorraine K. Harmon
 *  - Email:  Harmonlorraine363@gmail.com
 *  - Usernm: Harmonlorraine  (schema has no username column; kept in name only)
 *  - Pass:   comfortdotse
 *  - Account: INR
 *  - Txns:
 *      * Yesterday:  17,350 USD from "Clement Dzuvor"
 *      * Today:      1,000  USD cash deposit by owner
 *  - Final balance target: ₹1,613,540.02 = 18,350 USD @ constant FX
 *
 * We compute a single FX so both USD legs add exactly to ₹1,613,540.02 after 2dp:
 *    rate = 1,613,540.02 / 18,350 = 87.93133623978...
 *    17,350 USD -> ₹1,525,608.68
 *     1,000 USD ->   ₹87,931.34
 *    Sum          -> ₹1,613,540.02
 */

const INR = (rupeesMajor: number) => Math.round(rupeesMajor * 100);

async function main() {
  const fullName = "Lorraine K. Harmon";
  const email = "harmonlorraine363@gmail.com";
  const username = "Harmonlorraine";
  const passwordPlain = "comfortdotse";

  // Target maths
  const finalINRMajor = 1_613_540.02;
  const totalUSD = 18_350;
  const rate = finalINRMajor / totalUSD; // ≈ 87.93133623978

  const credit1USD = 17_350;
  const credit2USD = 1_000;

  // Round each leg to 2dp, then store as paise (minor units)
  const leg1INRMajor = Math.round(credit1USD * rate * 100) / 100; // 1,525,608.68
  const leg2INRMajor = Math.round(credit2USD * rate * 100) / 100; //   87,931.34

  const leg1INR = INR(leg1INRMajor); // 152,560,868
  const leg2INR = INR(leg2INRMajor); //   8,793,134
  const finalINR = leg1INR + leg2INR; // 161,354,002 = ₹1,613,540.02

  // Dates
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // Upsert user (safe to re-run)
  const passHash = await hash(passwordPlain, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: `${fullName} (${username})`,
      approved: true,
      status: "APPROVED",
    },
    create: {
      email,
      name: `${fullName} (${username})`,
      passwordHash: passHash,
      role: "USER",
      approved: true,
      status: "APPROVED",
    },
  });

  // Create INR account
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Everyday INR",
      type: "CURRENT",
      number: String(10_000_000 + Math.floor(Math.random() * 89_999_999)),
      sortCode: "23-45-67",
      currency: "INR",
      status: "OPEN",
      balance: 0,
    },
  });

  // Txn 1 — Yesterday (Clement Dzuvor)
  await prisma.transaction.create({
    data: {
      accountId: account.id,
      postedAt: yesterday,
      description: "Transfer from Clement Dzuvor (USD 17,350 converted)",
      amount: leg1INR,
      balanceAfter: leg1INR,
      // status defaults to POSTED via schema
    },
  });

  // Txn 2 — Today (cash deposit)
  await prisma.transaction.create({
    data: {
      accountId: account.id,
      postedAt: now,
      description: "Cash deposit (USD 1,000 converted)",
      amount: leg2INR,
      balanceAfter: finalINR,
    },
  });

  // Update account balance to final total
  await prisma.account.update({
    where: { id: account.id },
    data: { balance: finalINR },
  });

  console.log("Seeded Lorraine:", {
    user: user.email,
    accountId: account.id,
    balanceINR: "₹1,613,540.02",
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

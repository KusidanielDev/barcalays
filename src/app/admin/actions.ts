// FILE: src/app/admin/actions.ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Gate: must be admin (auth-backed, not guessy) */
async function mustAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.email || role !== "ADMIN") {
    redirect("/app");
  }
  return session;
}

function s(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string" || !v.trim()) throw new Error(`Missing ${key}`);
  return v.trim();
}

function toPence(input: unknown): number {
  const n = Number(input ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** OTP generator: fixed in dev, random in prod */
const genOtp = () =>
  process.env.NODE_ENV !== "production"
    ? "111111"
    : String(Math.floor(100000 + Math.random() * 900000));

/* =========================
   Transactions (existing)
   ========================= */

export async function updateTransactionStatusAction(formData: FormData) {
  await mustAdmin();
  const txId = s(formData, "txId");
  const status = s(formData, "status").toUpperCase();
  const adminMessage = (formData.get("adminMessage") as string | null) || null;
  const allowed = new Set(["POSTED", "PENDING", "ERROR", "REVERSED"]);
  if (!allowed.has(status)) throw new Error("Invalid status");
  await prisma.transaction.update({
    where: { id: txId },
    data: { status: status as any, adminMessage },
  });
  redirect("/admin");
}

/* =========================
   Recurring Income (existing)
   ========================= */

export async function upsertRecurringIncomeAction(formData: FormData) {
  await mustAdmin();
  const id = (formData.get("id") as string) || "";
  const userId = s(formData, "userId");
  const accountId = s(formData, "accountId");
  const name = s(formData, "name");
  const amountPence = Number(s(formData, "amountPence"));
  const interval = s(formData, "interval").toUpperCase();
  const nextRunAt = new Date(s(formData, "nextRunAt"));
  const active = (formData.get("active") as string) === "on";

  if (!Number.isInteger(amountPence) || amountPence <= 0)
    throw new Error("Invalid amount");
  if (!new Set(["WEEKLY", "MONTHLY"]).has(interval))
    throw new Error("Invalid interval");

  if (id) {
    await prisma.recurringIncome.update({
      where: { id },
      data: {
        userId,
        accountId,
        name,
        amountPence,
        interval: interval as any,
        nextRunAt,
        active,
      },
    });
  } else {
    await prisma.recurringIncome.create({
      data: {
        userId,
        accountId,
        name,
        amountPence,
        interval: interval as any,
        nextRunAt,
        active,
      },
    });
  }
  redirect("/admin");
}

export async function toggleRecurringIncomeAction(formData: FormData) {
  await mustAdmin();
  const id = s(formData, "id");
  const active = s(formData, "active");
  await prisma.recurringIncome.update({
    where: { id },
    data: { active: active === "true" },
  });
  redirect("/admin");
}

export async function runRecurringIncomeNowAction(formData: FormData) {
  await mustAdmin();
  const id = s(formData, "id");
  const inc = await prisma.recurringIncome.findUnique({
    where: { id },
    include: { account: true },
  });
  if (!inc || !inc.active) throw new Error("Income not active");

  await prisma.$transaction(async (tx) => {
    const acct = await tx.account.findUnique({ where: { id: inc.accountId } });
    if (!acct) throw new Error("Account not found");
    const newBal = acct.balance + inc.amountPence;

    await tx.account.update({
      where: { id: acct.id },
      data: { balance: newBal },
    });

    await tx.transaction.create({
      data: {
        accountId: acct.id,
        description: inc.name,
        amount: inc.amountPence,
        balanceAfter: newBal,
        status: "POSTED",
        postedAt: new Date(),
      },
    });

    const next = computeNextRun(inc.interval as any, new Date());
    await tx.recurringIncome.update({
      where: { id: inc.id },
      data: { lastRunAt: new Date(), nextRunAt: next },
    });
  });
  redirect("/admin");
}

function computeNextRun(interval: "WEEKLY" | "MONTHLY", from: Date) {
  const d = new Date(from);
  if (interval === "WEEKLY") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/* =========================
   Accounts & Users (existing)
   ========================= */

export async function updateAccountStatusAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const next = s(formData, "status").toUpperCase();
  const ALLOWED = new Set(["PENDING", "OPEN", "FROZEN", "CLOSED"]);
  if (!ALLOWED.has(next)) throw new Error("Invalid status");

  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;

  await prisma.account.update({
    where: { id: accountId },
    data: { status: next as any },
  });
}

export async function deleteAccountAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const ALLOW = process.env.HARD_DELETE === "true";
  if (!ALLOW) {
    throw new Error("Hard delete disabled (set HARD_DELETE=true to allow)");
  }

  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { accountId } });
    await tx.card.deleteMany({ where: { accountId } });
    await tx.account.delete({ where: { id: accountId } });
  });
}

export async function depositAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const amount = toPence(s(formData, "amount"));

  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;

  const newBal = (acct.balance ?? 0) + amount;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: acct.id },
      data: { balance: newBal },
    });
    await tx.transaction.create({
      data: {
        accountId: acct.id,
        postedAt: now,
        description: "Admin deposit",
        amount: amount,
        balanceAfter: newBal,
        status: "POSTED",
      },
    });
  });
}

export async function withdrawAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const amount = toPence(s(formData, "amount"));

  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;

  const newBal = (acct.balance ?? 0) - amount;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: acct.id },
      data: { balance: newBal },
    });
    await tx.transaction.create({
      data: {
        accountId: acct.id,
        postedAt: now,
        description: "Admin withdraw",
        amount: -amount,
        balanceAfter: newBal,
        status: "POSTED",
      },
    });
  });
}

export async function setUserRoleAction(formData: FormData) {
  await mustAdmin();
  const userId = s(formData, "userId");
  const role = s(formData, "role").toUpperCase();
  if (!["USER", "ADMIN"].includes(role)) throw new Error("Invalid role");
  await prisma.user.update({ where: { id: userId }, data: { role } as any });
}

export async function setUserApprovedAction(formData: FormData) {
  await mustAdmin();
  const userId = s(formData, "userId");
  const approvedVal = s(formData, "approved");
  const approved = approvedVal === "true";
  await prisma.user.update({
    where: { id: userId },
    data: { approved } as any,
  });
}

export async function setUserStatusAction(formData: FormData) {
  await mustAdmin();
  const userId = s(formData, "userId");
  const status = s(formData, "status").toUpperCase();
  const ALLOWED = new Set(["PENDING", "APPROVED", "REJECTED"]);
  if (!ALLOWED.has(status)) throw new Error("Invalid user status");
  await prisma.user.update({ where: { id: userId }, data: { status } as any });
}

export async function promoteAccountOwnerAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;
  await prisma.user.update({
    where: { id: acct.userId },
    data: { role: "ADMIN" as any },
  });
}

/* =========================
   NEW: Pending payments (OTP)
   ========================= */

export async function cancelPendingPaymentAction(formData: FormData) {
  await mustAdmin();
  const paymentId = s(formData, "paymentId");
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING_OTP" },
    data: { status: "FAILED", otpCode: null },
  });
  redirect("/admin");
}

export async function regenerateOtpAction(formData: FormData) {
  await mustAdmin();
  const paymentId = s(formData, "paymentId");
  const otp = genOtp();
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING_OTP" },
    data: { otpCode: otp },
  });
  redirect("/admin");
}

// FILE: src/app/admin/actions.ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Gate: must be admin */
async function mustAdmin() {
  const session = await auth();
  // role is a string in your schema: "USER" | "ADMIN"
  const role = (session?.user as any)?.role;
  if (!session?.user?.email || role !== "ADMIN") {
    redirect("/app");
  }
  return session;
}

function toPence(input: unknown): number {
  const n = Number(input ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
function s(fd: FormData, key: string) {
  return String(fd.get(key) ?? "");
}

/* =========================
   Accounts
   ========================= */

export async function updateAccountStatusAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const next = s(formData, "status").toUpperCase();

  // Your schema uses string statuses everywhere, keep it consistent:
  const ALLOWED = new Set(["PENDING", "OPEN", "FROZEN", "CLOSED"]);
  if (!ALLOWED.has(next)) throw new Error("Invalid status");

  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;

  // Ensure you've added `status String @default("PENDING")` to Account in schema
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
        amount,
        balanceAfter: newBal,
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
      },
    });
  });
}

/* =========================
   Users
   ========================= */

export async function setUserRoleAction(formData: FormData) {
  await mustAdmin();
  const userId = s(formData, "userId");
  const role = s(formData, "role").toUpperCase(); // "USER" | "ADMIN"
  if (!["USER", "ADMIN"].includes(role)) throw new Error("Invalid role");
  await prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function setUserApprovedAction(formData: FormData) {
  await mustAdmin();
  const userId = s(formData, "userId");
  const approvedVal = s(formData, "approved"); // "true" | "false"
  const approved = approvedVal === "true";
  await prisma.user.update({ where: { id: userId }, data: { approved } });
}

export async function setUserStatusAction(formData: FormData) {
  await mustAdmin();
  const userId = s(formData, "userId");
  const status = s(formData, "status").toUpperCase(); // "PENDING" | "APPROVED" | "REJECTED"
  const ALLOWED = new Set(["PENDING", "APPROVED", "REJECTED"]);
  if (!ALLOWED.has(status)) throw new Error("Invalid user status");
  await prisma.user.update({ where: { id: userId }, data: { status } });
}

/** Promote account owner to ADMIN directly from an account card */
export async function promoteAccountOwnerAction(formData: FormData) {
  await mustAdmin();
  const accountId = s(formData, "accountId");
  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) return;
  await prisma.user.update({
    where: { id: acct.userId },
    data: { role: "ADMIN" },
  });
}

// FILE: src/app/app/settings/actions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function updateProfileAction(formData: FormData) {
  const s = await auth();
  if (!s?.user?.email) return;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  await prisma.user.update({
    where: { email: s.user.email! },
    data: { name, phone },
  });
}

export async function changePasswordAction(formData: FormData) {
  const s = await auth();
  if (!s?.user?.email) return;

  const current = String(formData.get("current") || "");
  const pwd1 = String(formData.get("pwd1") || "");
  const pwd2 = String(formData.get("pwd2") || "");

  if (!pwd1 || pwd1 !== pwd2 || pwd1.length < 8) {
    throw new Error("Invalid password");
  }

  const u = await prisma.user.findUnique({ where: { email: s.user.email! } });
  if (!u) return;

  const ok = await bcrypt.compare(current, u.passwordHash);
  if (!ok) throw new Error("Wrong current password");

  const hash = await bcrypt.hash(pwd1, 10);
  await prisma.user.update({
    where: { id: u.id },
    data: { passwordHash: hash },
  });
}

export async function clearLoginHistoryAction() {
  const s = await auth();
  if (!s?.user?.email) return;
  const u = await prisma.user.findUnique({ where: { email: s.user.email! } });
  if (!u) return;
  await prisma.auditLog.deleteMany({
    where: { userId: u.id, action: "LOGIN" },
  });
}

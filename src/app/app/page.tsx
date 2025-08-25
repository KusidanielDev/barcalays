// FILE: src/app/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppEntry() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  // Be consistent: store & compare emails in lowercase
  const email = session.user.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login");

  try {
    const [bankingCount, investCount] = await prisma.$transaction([
      prisma.account.count({
        where: { userId: user.id, NOT: { type: "INVESTMENT" } },
      }),
      prisma.account.count({
        where: { userId: user.id, type: "INVESTMENT" },
      }),
    ]);

    // Prefer banking if present; otherwise go investment; otherwise open-account
    if (bankingCount > 0) redirect("/app/home");
    if (investCount > 0) redirect("/app/invest");
  } catch (err) {
    // Show a safe route instead of blowing up the server render
    console.error("AppEntry routing error", err);
  }

  redirect("/app/accounts/new");
}

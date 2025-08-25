// FILE: src/app/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppEntry() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/login");

  const [bankingCount, investCount] = await Promise.all([
    prisma.account.count({
      where: { userId: user.id, NOT: { type: "INVESTMENT" } }, // CURRENT/SAVINGS/anything-not-investment
    }),
    prisma.account.count({
      where: { userId: user.id, type: "INVESTMENT" },
    }),
  ]);

  // If the user has ANY banking account, send them to banking first.
  // Otherwise, if they only have investment accounts, send to investments.
  if (bankingCount > 0) redirect("/app/home");
  if (investCount > 0) redirect("/app/invest");

  // No accounts yet → send to open-account flow (adjust path if different in your app)
  redirect("/app/accounts/new");
}

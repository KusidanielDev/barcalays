// FILE: src/app/app/analytics/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  SpendingTrend,
  TopMerchants,
  CategorySplit,
} from "@/components/AnalyticsCharts";

// Never pre-render; always use the live session + DB
export const dynamic = "force-dynamic";
export const revalidate = 0;

type TrendPoint = { month: string; inflow: number; outflow: number };
type TopPoint = { name: string; amount: number };
type PiePoint = { name: string; value: number };

function fmtMonth(d: Date) {
  // Normalize to first of month to avoid TZ jitter
  const dd = new Date(d.getFullYear(), d.getMonth(), 1);
  return dd.toLocaleString("en-GB", { month: "short", year: "2-digit" });
}

export default async function AnalyticsPage() {
  // Require login; if not logged in, go to login with return path
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?from=/app/analytics");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!user) {
    // Logged-in cookie but no DB row (shouldn’t happen) — force fresh sign-in
    redirect("/login?from=/app/analytics");
  }

  // === Last 6 whole months (including current) inflow/outflow ===
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(1); // first day of current month
  start.setMonth(start.getMonth() - 5);

  const tx = await prisma.transaction.findMany({
    where: { account: { userId: user.id }, postedAt: { gte: start } },
    select: { postedAt: true, amount: true, description: true },
    orderBy: { postedAt: "asc" },
  });

  const months: Map<string, { inflow: number; outflow: number }> = new Map();
  // prime the 6 buckets so charts don’t “jump”
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.set(fmtMonth(d), { inflow: 0, outflow: 0 });
  }
  for (const t of tx) {
    const key = fmtMonth(new Date(t.postedAt));
    if (!months.has(key)) months.set(key, { inflow: 0, outflow: 0 });
    const b = months.get(key)!;
    if (t.amount >= 0) b.inflow += t.amount / 100;
    else b.outflow += Math.abs(t.amount / 100);
  }
  const trend: TrendPoint[] = Array.from(months.entries()).map(
    ([month, v]) => ({
      month,
      inflow: Number(v.inflow.toFixed(2)),
      outflow: Number(v.outflow.toFixed(2)),
    })
  );

  // === Top “merchants” (by description) for outflows in last 90 days ===
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  since90.setHours(0, 0, 0, 0);

  const recentOut = await prisma.transaction.findMany({
    where: {
      account: { userId: user.id },
      postedAt: { gte: since90 },
      amount: { lt: 0 },
    },
    select: { description: true, amount: true },
  });

  const byDesc = new Map<string, number>();
  for (const t of recentOut) {
    const key =
      (t.description || "").trim().toUpperCase().slice(0, 40) || "OTHER";
    byDesc.set(key, (byDesc.get(key) || 0) + Math.abs(t.amount / 100));
  }
  const top: TopPoint[] = Array.from(byDesc.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }));

  // === Category split (naive keyword bucketing) ===
  const kw = [
    {
      key: "Groceries",
      words: ["TESCO", "SAINSBURY", "ALDI", "LIDL", "MORRISONS", "ASDA"],
    },
    {
      key: "Transport",
      words: ["TFL", "UBER", "TRAIN", "BUS", "NATIONAL RAIL"],
    },
    {
      key: "Eating out",
      words: ["JUST EAT", "DELIVEROO", "UBER EATS", "RESTAURANT"],
    },
    { key: "Shopping", words: ["AMAZON", "EBAY", "ARGOS", "CURRYS"] },
    {
      key: "Bills",
      words: ["BT", "VIRGIN", "SKY", "EDF", "OCTOPUS", "THAMES WATER"],
    },
  ];
  const buckets = new Map<string, number>([
    ...kw.map((k) => [k.key, 0] as const),
  ]);
  buckets.set("Other", 0);

  for (const t of recentOut) {
    const d = (t.description || "").toUpperCase();
    let matched = false;
    for (const k of kw) {
      if (k.words.some((w) => d.includes(w))) {
        buckets.set(k.key, buckets.get(k.key)! + Math.abs(t.amount / 100));
        matched = true;
        break;
      }
    }
    if (!matched)
      buckets.set("Other", buckets.get("Other")! + Math.abs(t.amount / 100));
  }
  const pie: PiePoint[] = Array.from(buckets.entries()).map(([name, v]) => ({
    name,
    value: Number(v.toFixed(2)),
  }));

  return (
    <div className="container py-8 grid gap-6">
      <h1 className="text-2xl font-bold text-barclays-navy">Analytics</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        <SpendingTrend data={trend} />
        <TopMerchants data={top} />
      </div>

      <div className="grid gap-4">
        <CategorySplit data={pie} />
      </div>
    </div>
  );
}

// FILE: src/app/invest/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HoldingsTable from "./parts/HoldingsTable";
import AllocationCharts from "./parts/AllocationCharts";
import OrdersTable from "./parts/OrdersTable";
import CashTable from "./parts/CashTable";

type ClientAccount = {
  id: string;
  name: string;
  number: string;
  balance: number; // pence
  currency: string;
};

type ClientHolding = {
  id: string;
  accountId: string;
  quantity: number; // Decimal -> number
  avgCostP: number; // pence
  updatedAt: string; // Date -> ISO string
  security: { symbol: string; name: string; currency: string };
  account: { id: string; name: string };
};

type ClientOrder = {
  id: string;
  placedAt: string; // Date -> ISO
  account: { name: string };
  security: { symbol: string };
  side: string;
  quantity: number; // Decimal -> number
  status: string;
  estCostPence: number | null;
};

type ClientCash = {
  id: string;
  postedAt: string; // Date -> ISO
  account: { name: string };
  type: string;
  amountPence: number;
  note: string | null;
};

export default async function InvestHub() {
  const session = await auth();
  if (!session?.user?.email)
    return <div className="container py-8">Please sign in.</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const accountsDb = await prisma.account.findMany({
    where: {
      userId: user!.id,
      type: "INVESTMENT",
      status: { in: ["OPEN", "PENDING"] },
    },
    orderBy: { createdAt: "asc" },
  });

  const accountIds = accountsDb.map((a) => a.id);

  const holdingsDb = await prisma.holding.findMany({
    where: { accountId: { in: accountIds } },
    include: { security: true, account: true },
    orderBy: { updatedAt: "desc" },
  });

  const ordersDb = await prisma.investOrder.findMany({
    where: { accountId: { in: accountIds } },
    include: { security: true, account: true },
    orderBy: { placedAt: "desc" },
    take: 50,
  });

  const cashTxnsDb = await prisma.investCashTxn.findMany({
    where: { accountId: { in: accountIds } },
    include: { account: true },
    orderBy: { postedAt: "desc" },
    take: 50,
  });

  // ---- Serialize for client components (plain JSON-ish) ----
  const accounts: ClientAccount[] = accountsDb.map((a) => ({
    id: a.id,
    name: a.name,
    number: a.number,
    balance: a.balance,
    currency: a.currency,
  }));

  const holdings: ClientHolding[] = holdingsDb.map((h) => ({
    id: h.id,
    accountId: h.accountId,
    quantity: Number(h.quantity as any), // Prisma.Decimal -> number
    avgCostP: h.avgCostP,
    updatedAt: h.updatedAt.toISOString(),
    security: {
      symbol: h.security.symbol,
      name: h.security.name,
      currency: h.security.currency,
    },
    account: {
      id: h.account.id,
      name: h.account.name,
    },
  }));

  const orders: ClientOrder[] = ordersDb.map((o) => ({
    id: o.id,
    placedAt: o.placedAt.toISOString(),
    account: { name: o.account.name },
    security: { symbol: o.security.symbol },
    side: o.side,
    quantity: Number(o.quantity as any),
    status: o.status,
    estCostPence: o.estCostPence,
  }));

  const cashTxns: ClientCash[] = cashTxnsDb.map((t) => ({
    id: t.id,
    postedAt: t.postedAt.toISOString(),
    account: { name: t.account.name },
    type: t.type,
    amountPence: t.amountPence,
    note: t.note ?? null,
  }));

  const totalCashP = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold text-barclays-navy">My Hub</h1>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="card">
          <div className="text-sm text-gray-600">Investment accounts</div>
          <div className="text-2xl font-semibold">{accounts.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Cash available</div>
          <div className="text-2xl font-semibold">
            £{(totalCashP / 100).toFixed(2)}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Holdings</div>
          <div className="text-2xl font-semibold">{holdings.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="tabs">
          <input type="radio" name="tab" id="t1" defaultChecked />
          <label htmlFor="t1">Overview</label>
          <input type="radio" name="tab" id="t2" />
          <label htmlFor="t2">Analyse</label>
          <input type="radio" name="tab" id="t3" />
          <label htmlFor="t3">Orders</label>
          <input type="radio" name="tab" id="t4" />
          <label htmlFor="t4">Cash</label>
          <div className="tab-content">
            {/* Overview */}
            <section data-tab="t1">
              <HoldingsTable accounts={accounts} holdings={holdings} />
            </section>
            {/* Analyse */}
            <section data-tab="t2">
              <AllocationCharts holdings={holdings} />
            </section>
            {/* Orders */}
            <section data-tab="t3">
              <OrdersTable orders={orders} />
            </section>
            {/* Cash */}
            <section data-tab="t4">
              <CashTable txns={cashTxns} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

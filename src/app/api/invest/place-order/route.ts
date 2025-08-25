import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const BASE: Record<string, number> = {
  AAPL: 189.12,
  TSLA: 239.55,
  VUSA: 77.32,
  LGEN: 2.45,
  HSBA: 6.9,
  MSFT: 430.25,
  AMZN: 171.16,
  NVDA: 122.55,
  GOOGL: 168.38,
  META: 517.57,
  BP: 4.85,
  SHEL: 28.72,
  BARC: 1.45,
  RIO: 56.12,
  VOD: 0.72,
  INF: 8.5,
  ENM: 9.1,
};
function priceFor(sym: string, t: number) {
  const base = BASE[sym] ?? 100;
  const wave = Math.sin(Math.floor(t / 7000)) * 0.5;
  const micro = ((t % 10000) / 10000 - 0.5) * 0.4;
  return Math.max(0.5, base + wave + micro);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (!email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { accountId, symbol, side, quantity } = body as {
      accountId: string;
      symbol: string;
      side: "BUY" | "SELL";
      quantity: number;
    };
    if (!accountId || !symbol || !side || !quantity || quantity <= 0)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
        type: "INVESTMENT",
        status: { in: ["OPEN", "PENDING"] },
      },
    });
    if (!account)
      return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const t = Date.now();
    const sym = symbol.toUpperCase();
    const px = priceFor(sym, t);
    const pxPence = Math.round(px * 100);
    const qty = new Prisma.Decimal(quantity);
    const notionalP = new Prisma.Decimal(pxPence).mul(qty).toNumber();
    const feeP = Math.max(100, Math.round(notionalP * 0.001)); // £1 min or 0.1%

    const security = await prisma.security.upsert({
      where: { symbol: sym },
      update: {},
      create: { symbol: sym, name: sym, currency: "GBP", kind: "EQUITY" },
    });

    const result = await prisma.$transaction(async (tx) => {
      if (side === "BUY") {
        if (account.balance < notionalP + feeP)
          throw new Error("Insufficient cash");

        const newBal = account.balance - notionalP - feeP;
        await tx.account.update({
          where: { id: account.id },
          data: { balance: newBal, status: "OPEN" },
        });

        const existing = await tx.holding.findUnique({
          where: {
            accountId_securityId: {
              accountId: account.id,
              securityId: security.id,
            },
          },
        });
        if (!existing) {
          await tx.holding.create({
            data: {
              accountId: account.id,
              securityId: security.id,
              quantity: qty,
              avgCostP: pxPence,
            },
          });
        } else {
          const oldQty = new Prisma.Decimal(existing.quantity);
          const newQty = oldQty.add(qty);
          const oldCostTotal = oldQty.mul(existing.avgCostP);
          const newCostTotal = oldCostTotal.add(qty.mul(pxPence));
          const newAvg = Number(newCostTotal.div(newQty).toFixed(0));
          await tx.holding.update({
            where: { id: existing.id },
            data: { quantity: newQty, avgCostP: newAvg },
          });
        }

        const order = await tx.investOrder.create({
          data: {
            accountId: account.id,
            securityId: security.id,
            side: "BUY",
            orderType: "MARKET",
            quantity: qty,
            limitPence: null,
            status: "FILLED",
            feePence: feeP,
            estCostPence: notionalP + feeP,
          },
        });

        await tx.investCashTxn.create({
          data: {
            accountId: account.id,
            type: "TRADE",
            amountPence: -(notionalP + feeP),
            note: `BUY ${security.symbol} x ${quantity} @ £${(
              pxPence / 100
            ).toFixed(2)}`,
          },
        });

        await tx.transaction.create({
          data: {
            accountId: account.id,
            postedAt: new Date(),
            description: `BUY ${security.symbol} x ${quantity} @ £${(
              pxPence / 100
            ).toFixed(2)}`,
            amount: -(notionalP + feeP),
            balanceAfter: newBal,
          },
        });

        return {
          orderId: order.id,
          newBalance: newBal,
          symbol: sym,
          execPricePence: pxPence,
        };
      }

      // SELL
      const holding = await tx.holding.findUnique({
        where: {
          accountId_securityId: {
            accountId: account.id,
            securityId: security.id,
          },
        },
      });
      if (!holding) throw new Error("No position");
      const haveQty = new Prisma.Decimal(holding.quantity);
      if (haveQty.lessThan(qty)) throw new Error("Not enough quantity");

      const newQty = haveQty.sub(qty);
      if (newQty.lessThanOrEqualTo(0)) {
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        await tx.holding.update({
          where: { id: holding.id },
          data: { quantity: newQty },
        });
      }

      const proceedsP = notionalP - feeP;
      const newBal = account.balance + proceedsP;
      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBal, status: "OPEN" },
      });

      const order = await tx.investOrder.create({
        data: {
          accountId: account.id,
          securityId: security.id,
          side: "SELL",
          orderType: "MARKET",
          quantity: qty,
          limitPence: null,
          status: "FILLED",
          feePence: feeP,
          estCostPence: proceedsP,
        },
      });

      await tx.investCashTxn.create({
        data: {
          accountId: account.id,
          type: "TRADE",
          amountPence: proceedsP,
          note: `SELL ${security.symbol} x ${quantity} @ £${(
            pxPence / 100
          ).toFixed(2)}`,
        },
      });

      await tx.transaction.create({
        data: {
          accountId: account.id,
          postedAt: new Date(),
          description: `SELL ${security.symbol} x ${quantity} @ £${(
            pxPence / 100
          ).toFixed(2)}`,
          amount: proceedsP,
          balanceAfter: newBal,
        },
      });

      return {
        orderId: order.id,
        newBalance: newBal,
        symbol: sym,
        execPricePence: pxPence,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
      account: { id: accountId, balance: result.newBalance },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Order failed" },
      { status: 400 }
    );
  }
}
